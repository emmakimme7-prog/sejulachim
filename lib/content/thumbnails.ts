import "server-only";

import { getOptionalServerEnv } from "@/lib/env";
import { createOpenAIClient, selectOpenAIModel } from "@/lib/openai/model-router";
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
  혈압: ["blood pressure monitor cuff", "heart health checkup"],
  관절: ["knee joint pain senior exercise", "knee stretching elderly"],
  음식: ["healthy meal plate vegetables", "nutritious food dish table"],
  상식: ["doctor patient consultation office", "medical advice stethoscope"],
  병원: ["hospital corridor doctor nurse", "medical clinic waiting room"],
  연금: ["retirement savings piggy bank", "pension fund elderly couple"],
  세금: ["tax form calculator documents", "income tax filing paperwork"],
  보험: ["insurance policy document signing", "health insurance card form"],
  주의: ["phone scam fraud warning alert", "cybersecurity warning lock"],
  혜택: ["government benefit application form", "welfare support voucher card"],
  꿀팁: ["household life hack smart tip", "home organization simple trick"],
  가전: ["modern kitchen appliance home", "washing machine refrigerator home"],
  청소: ["house cleaning spray mop bucket", "home deep cleaning supplies"],
  요리: ["Korean home cooking ingredients", "fresh vegetables cooking pan"],
  교통: ["subway train bus public transit", "commuter bus stop station"],
  "주요 뉴스": ["press conference podium microphone", "parliament assembly meeting"],
  경제: ["stock market graph chart finance", "economy business graph upward"],
  정책: ["government building official meeting", "policy announcement briefing"],
  사회: ["community people city street", "social issue protest crowd"],
  해외: ["world map globe diplomacy flags", "international summit conference"],
  가족: ["happy family dinner table home", "family conversation living room"],
  부부: ["couple talking sofa living room", "married couple conversation home"],
  회사: ["office desk computer workplace", "business meeting conference room"],
  취미: ["hobby craft creative activity hand", "baking cooking leisure home"],
  친구: ["friends chatting coffee cafe", "group friends laughing together"]
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
            "You create concise English search queries for free editorial or stock photos.",
            "Return only one line of plain text.",
            "Use 2 to 6 English words.",
            "Avoid brand names, punctuation, and quotes.",
            "Prioritize a visually searchable scene that matches the article's specific topic over generic category images."
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

    const query = completion.choices[0]?.message?.content?.trim();
    return query ? sanitizePlainText(query, 80) : buildFallbackQuery(input);
  } catch {
    return buildFallbackQuery(input);
  }
}

async function searchWikimediaCommons(query: string) {
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

async function searchPixabay(query: string, apiKey: string) {
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

export async function findRelatedContentThumbnail(input: {
  title: string;
  category: string;
  subInterest?: string | null;
  summary?: string | null;
}) {
  const env = getOptionalServerEnv();
  const aiQuery = await translateToImageQuery(input);
  const fallbackQuery = buildFallbackQuery(input);
  const queries = Array.from(new Set([aiQuery, fallbackQuery].filter(Boolean)));

  if (env.PIXABAY_API_KEY) {
    for (const query of queries) {
      let result = null;
      try {
        result = await searchPixabay(query, env.PIXABAY_API_KEY);
      } catch {
        result = null;
      }
      if (!result?.url) {
        continue;
      }

      return {
        url: result.url,
        pageUrl: result.pageUrl,
        author: result.author,
        license: null,
        alt: sanitizePlainText(result.alt || input.title || "기사 관련 썸네일", 160)
      } satisfies ContentThumbnail;
    }
  }

  for (const query of queries) {
    const result = await searchWikimediaCommons(query);
    if (!result) {
      continue;
    }

    return {
      url: result.url,
      pageUrl: result.pageUrl,
      author: result.author,
      license: result.license,
      alt: sanitizePlainText(result.description || input.title || result.title || "기사 관련 썸네일", 160)
    } satisfies ContentThumbnail;
  }

  return null;
}
