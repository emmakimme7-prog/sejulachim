import "server-only";

import { createHash } from "node:crypto";

import { getOptionalServerEnv } from "@/lib/env";
import { createOpenAIClient, selectOpenAIModel } from "@/lib/openai/model-router";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sanitizePlainText } from "@/lib/utils";

export type ContentThumbnail = {
  url: string;
  alt: string;
  pageUrl: string;
  author?: string | null;
  license?: string | null;
};

type WikimediaQueryResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          descriptionurl?: string;
          mime?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }
    >;
  };
};

type PixabaySearchResponse = {
  hits?: Array<{
    pageURL?: string;
    tags?: string;
    webformatURL?: string;
    largeImageURL?: string;
    user?: string;
  }>;
};

const BLOCKED_PIXABAY_TERMS = [
  "smoking",
  "cigarette",
  "cigarettes",
  "tobacco",
  "nicotine",
  "ashtray",
  "vape",
  "vaping",
  "cigar",
  "beer",
  "alcohol",
  "wine",
  "whiskey",
  "vodka"
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  건강: ["health", "wellness"],
  돈: ["finance", "money"],
  실생활: ["daily life", "home tips"],
  뉴스: ["news", "current events"],
  관계: ["relationship", "social life"]
};

const SUB_INTEREST_KEYWORDS: Record<string, string[]> = {
  혈압: ["blood pressure exercise yoga stretching fitness", "cardio workout heart rate monitor exercise"],
  관절: ["spring outdoor stretching knee warm up", "knee joint stretching exercise morning"],
  음식: ["spring greens wild herbs Korean namul basket", "fresh spring vegetables herbs market"],
  상식: ["eating order vegetables first healthy meal", "doctor patient consultation medical advice"],
  병원: ["hospital outpatient clinic reception counter", "medical bill healthcare cost insurance"],
  연금: ["national pension retirement savings plan chart", "pension contribution payroll deduction salary"],
  세금: ["government budget emergency spending parliament", "income tax filing calculator documents"],
  보험: ["travel insurance airplane luggage airport", "insurance policy document coverage plan"],
  주의: ["data breach personal information leak cybersecurity", "phone scam fraud warning security alert"],
  혜택: ["fuel gasoline diesel price subsidy support", "government benefit voucher coupon discount"],
  꿀팁: ["towel laundry citric acid washing machine clean", "home organization cleaning supplies hack"],
  가전: ["smart home AI appliance kitchen modern living", "washing machine refrigerator smart home"],
  청소: ["robot vacuum cleaner AI obstacle avoidance home", "house cleaning spray mop deep clean"],
  요리: ["Korean restaurant kitchen chef cooking Seoul", "fresh vegetables cooking pan Korean dish"],
  교통: ["subway train commuter transit pass discount", "public transport bus commuter daily ride"],
  "주요 뉴스": ["central bank interest rate decision economy", "press conference podium microphone parliament"],
  경제: ["US Iran diplomacy negotiation meeting flags", "stock market graph chart finance economy"],
  정책: ["government culture tourism budget spending support", "policy announcement briefing meeting official"],
  사회: ["protest demonstration social issue community", "social justice activism rally human rights"],
  해외: ["diplomacy summit meeting international politics", "global politics negotiation world leaders"],
  가족: ["elderly couple care nursing senior dignity", "happy family dinner table home conversation"],
  부부: ["couple counseling therapy communication relationship", "married couple conversation sofa living room"],
  회사: ["office worker stress workplace professional", "business meeting conference room desk"],
  취미: ["local community hobby meetup neighbors gathering", "hobby craft creative activity leisure"],
  친구: ["lonely man alone solitude friendship crisis", "friends chatting coffee cafe gathering"]
};

function stripHtml(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFallbackQuery(input: {
  title: string;
  category: string;
  subInterest?: string | null;
}) {
  const categoryKeywords = CATEGORY_KEYWORDS[input.category] ?? ["lifestyle"];
  const subInterestKeywords = input.subInterest ? (SUB_INTEREST_KEYWORDS[input.subInterest] ?? []) : [];
  return [...subInterestKeywords, ...categoryKeywords].slice(0, 2).join(" ");
}

async function translateToImageQuery(input: {
  title: string;
  category: string;
  subInterest?: string | null;
  summary?: string | null;
}) {
  const env = getOptionalServerEnv();
  if (!env.OPENAI_API_KEY) {
    return buildFallbackQuery(input);
  }

  try {
    const client = createOpenAIClient();
    const routedModel = await selectOpenAIModel([
      "한국어 기사 제목과 내용을 바탕으로 무료 이미지 검색용 짧은 영어 쿼리 한 줄을 만드는 작업입니다.",
      "짧은 답변이면 충분하고 구조화된 복잡한 추론은 필요하지 않습니다."
    ].join(" "));
    const completion = await client.chat.completions.create({
      model: routedModel.model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: [
            "You create concise English search queries for free stock photos on Pixabay.",
            "Return exactly TWO lines of plain text, each a separate search query.",
            "Use 4 to 6 English words per line.",
            "Avoid brand names, punctuation, quotes, and Korean words.",
            "Focus on the SPECIFIC subject of the article, not the broad category.",
            "Example: For an article about towel care with citric acid, use 'white towel fluffy clean folded stack' NOT 'motorcycle rider city street'.",
            "Think about what physical objects, scenes, or actions the article describes, then translate those into photo search terms."
          ].join(" ")
        },
        {
          role: "user",
          content: [
            `title: ${sanitizePlainText(input.title, 160)}`,
            `category: ${sanitizePlainText(input.category, 40)}`,
            `subInterest: ${sanitizePlainText(input.subInterest ?? "", 80)}`,
            input.summary ? `summary: ${sanitizePlainText(input.summary, 300)}` : ""
          ].filter(Boolean).join("\n")
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return [buildFallbackQuery(input)];
    // AI가 2줄 반환 → 각각 별도 쿼리로 사용
    const lines = raw.split(/\n+/).map((l) => sanitizePlainText(l.trim(), 80)).filter(Boolean);
    return lines.length > 0 ? lines : [buildFallbackQuery(input)];
  } catch {
    return [buildFallbackQuery(input)];
  }
}

async function searchWikimediaCommons(query: string, excludePageUrls?: Set<string>) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "8");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|extmetadata");
  url.searchParams.set("iiurlwidth", "1200");

  const response = await fetch(url, {
    headers: {
      "user-agent": "sejulachim-thumbnail-fetcher/1.0"
    },
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!response.ok) {
    throw new Error(`WIKIMEDIA_FETCH_FAILED:${response.status}`);
  }

  const data = (await response.json()) as WikimediaQueryResponse;
  const pages = Object.values(data.query?.pages ?? {});

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl) {
      continue;
    }
    if (excludePageUrls?.has(info.descriptionurl)) {
      continue;
    }

    const mime = info.mime?.toLowerCase() ?? "";
    if (!mime.startsWith("image/") || mime.includes("svg") || mime.includes("tiff")) {
      continue;
    }

    const author = stripHtml(info.extmetadata?.Artist?.value);
    const license = stripHtml(info.extmetadata?.LicenseShortName?.value);
    const description = stripHtml(info.extmetadata?.ImageDescription?.value);

    return {
      url: info.thumburl,
      pageUrl: info.descriptionurl,
      author: author || null,
      license: license || null,
      description,
      title: page.title ?? ""
    };
  }

  return null;
}

async function searchPixabay(query: string, apiKey: string, excludePageUrls?: Set<string>) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "10");

  const response = await fetch(url, {
    headers: {
      "user-agent": "sejulachim-thumbnail-fetcher/1.0"
    },
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!response.ok) {
    throw new Error(`PIXABAY_FETCH_FAILED:${response.status}`);
  }

  const data = (await response.json()) as PixabaySearchResponse;
  const photo = data.hits?.find((item) => {
    if (!item.largeImageURL && !item.webformatURL) {
      return false;
    }
    if (excludePageUrls?.has(item.pageURL ?? "")) {
      return false;
    }
    const haystack = `${item.tags ?? ""} ${item.pageURL ?? ""}`.toLowerCase();
    return !BLOCKED_PIXABAY_TERMS.some((term) => haystack.includes(term));
  });
  if (!photo) {
    return null;
  }

  return {
    url: photo.webformatURL || photo.largeImageURL || "",
    pageUrl: photo.pageURL || "",
    author: photo.user ? sanitizePlainText(photo.user, 120) : null,
    alt: sanitizePlainText(photo.tags || "기사 관련 썸네일", 160)
  };
}

const STORAGE_BUCKET = "thumbnails";

/**
 * Pixabay 이미지를 다운로드하여 Supabase Storage에 영구 저장.
 * 실패 시 원본 URL 반환 (폴백).
 */
async function rehostToStorage(imageUrl: string, title: string): Promise<string> {
  try {
    const supabase = createAdminSupabaseClient();
    const hash = createHash("md5").update(title).digest("hex").slice(0, 16);
    const ext = imageUrl.includes(".png") ? "png" : "jpg";
    const storagePath = `${hash}.${ext}`;

    // 이미지 다운로드
    const response = await fetch(imageUrl);
    if (!response.ok) return imageUrl;

    const contentType = response.headers.get("content-type") || `image/${ext === "png" ? "png" : "jpeg"}`;
    const buffer = Buffer.from(await response.arrayBuffer());

    // 버킷 없으면 생성 시도 (이미 있으면 무시)
    await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => undefined);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (error) {
      return imageUrl;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl || imageUrl;
  } catch {
    return imageUrl;
  }
}

export async function findRelatedContentThumbnail(input: {
  title: string;
  category: string;
  subInterest?: string | null;
  summary?: string | null;
  excludePageUrls?: Set<string>;
}) {
  const env = getOptionalServerEnv();
  const aiQueries = await translateToImageQuery(input);
  const fallbackQuery = buildFallbackQuery(input);
  const queries = Array.from(new Set([...aiQueries, fallbackQuery].filter(Boolean)));

  const pixabayKey = env.PIXABAY_API_KEY?.trim();
  const exclude = input.excludePageUrls;

  // Pixabay 우선 (고품질), Wikimedia 폴백
  for (const query of queries) {
    if (pixabayKey) {
      const pixabayResult = await searchPixabay(query, pixabayKey, exclude);
      if (pixabayResult) {
        // Pixabay URL은 24시간 후 만료 → Supabase Storage에 영구 저장
        const permanentUrl = await rehostToStorage(pixabayResult.url, input.title + query);
        return {
          url: permanentUrl,
          pageUrl: pixabayResult.pageUrl,
          author: pixabayResult.author,
          license: null,
          alt: sanitizePlainText(pixabayResult.alt || input.title || "기사 관련 썸네일", 160)
        } satisfies ContentThumbnail;
      }
    }

    const wikiResult = await searchWikimediaCommons(query, exclude);
    if (wikiResult) {
      return {
        url: wikiResult.url,
        pageUrl: wikiResult.pageUrl,
        author: wikiResult.author,
        license: wikiResult.license,
        alt: sanitizePlainText(wikiResult.description || input.title || wikiResult.title || "기사 관련 썸네일", 160)
      } satisfies ContentThumbnail;
    }
  }

  return null;
}
