import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

function loadEnvFile(filename) {
  const filePath = resolve(process.cwd(), filename);
  const raw = readFileSync(filePath, "utf8");
  const entries = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }

  return entries;
}

const env = {
  ...loadEnvFile(".env.local"),
  ...process.env
};

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_ENV_MISSING");
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

const CATEGORY_KEYWORDS = {
  건강: ["healthy lifestyle", "wellness routine"],
  돈: ["personal finance", "budget planning"],
  실생활: ["daily life tips", "home routine"],
  뉴스: ["city news", "public information"],
  관계: ["relationships", "social connection"]
};

const SUB_INTEREST_KEYWORDS = {
  혈압: ["blood pressure monitor", "health check"],
  관절: ["joint care", "knee exercise"],
  음식: ["healthy meal", "balanced food"],
  상식: ["doctor advice", "health information"],
  병원: ["hospital visit", "clinic waiting room"],
  연금: ["retirement planning", "pension documents"],
  세금: ["tax documents", "paperwork desk"],
  보험: ["insurance paperwork", "insurance consultant"],
  주의: ["fraud warning", "phone scam alert"],
  혜택: ["government benefits", "discount guide"],
  꿀팁: ["daily life tips", "home hacks"],
  가전: ["home appliance", "kitchen appliance"],
  청소: ["home cleaning", "cleaning supplies"],
  요리: ["home cooking", "kitchen meal"],
  교통: ["public transport", "traffic update"],
  "주요 뉴스": ["headline news", "news report"],
  경제: ["economy news", "market trend"],
  정책: ["government policy", "public service"],
  사회: ["society issue", "community news"],
  해외: ["world news", "global economy"],
  가족: ["family at home", "family conversation"],
  부부: ["couple at home", "married life"],
  회사: ["office teamwork", "work meeting"],
  취미: ["hobby activity", "creative hobby"],
  친구: ["friends talking", "friend meetup"]
};

const GENERIC_QUERY_TERMS = new Set([
  "headline", "news", "report", "issue", "policy", "public", "service",
  "relationship", "social", "connection", "activity", "teamwork",
  "market", "trend", "routine", "information", "advice", "government",
  "family", "home", "office", "world", "economy", "community", "hobby",
  "friends", "transport", "daily", "life", "society", "city", "global",
  "creative", "conversation", "update", "hacks", "lifestyle", "meeting"
]);

const STORAGE_BUCKET = "thumbnails";

async function rehostToStorage(imageUrl, slug) {
  try {
    const { createHash } = await import("node:crypto");
    const hash = createHash("md5").update(slug).digest("hex").slice(0, 16);
    const ext = imageUrl.includes(".png") ? "png" : "jpg";
    const storagePath = `${hash}.${ext}`;

    const response = await fetch(imageUrl);
    if (!response.ok) return imageUrl;

    const contentType = response.headers.get("content-type") || `image/${ext === "png" ? "png" : "jpeg"}`;
    const buffer = Buffer.from(await response.arrayBuffer());

    await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => undefined);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (error) return imageUrl;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl || imageUrl;
  } catch {
    return imageUrl;
  }
}

const BLOCKED_PIXABAY_TERMS = [
  "smoking", "cigarette", "cigarettes", "tobacco", "nicotine",
  "ashtray", "vape", "vaping", "cigar", "beer", "alcohol",
  "wine", "whiskey", "vodka"
];

function sanitize(text, limit = 120) {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function tokenizeEnglish(text) {
  return sanitize(text, 200)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function isGenericQuery(query) {
  const tokens = tokenizeEnglish(query);
  if (tokens.length === 0) return true;
  const specificCount = tokens.filter((token) => !GENERIC_QUERY_TERMS.has(token)).length;
  return specificCount === 0;
}

function fallbackQuery(item) {
  const subKeywords = item.sub_interest ? SUB_INTEREST_KEYWORDS[item.sub_interest] ?? [] : [];
  const categoryKeywords = CATEGORY_KEYWORDS[item.category] ?? ["daily lifestyle"];
  const queries = [...subKeywords, ...categoryKeywords].filter((query) => !isGenericQuery(query));
  if (item.category === "뉴스" || item.category === "관계") {
    return [];
  }
  return queries.slice(0, 2);
}

async function aiQueries(item) {
  if (!openai) return null;
  try {
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      text: {
        format: {
          type: "json_schema",
          name: "thumbnail_queries",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              queries: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
                maxItems: 3
              }
            },
            required: ["queries"]
          }
        }
      },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "Create English stock photo search queries for article thumbnails.",
                "Prefer a concrete real-world scene from the article over abstract category images.",
                "Do not use generic phrases like headline news, government policy, office teamwork, family at home, society issue, public information.",
                "Use 2 to 6 English words per query.",
                "Prefer visible nouns and scenes such as documents, buses, eyeglasses, classroom, hospital corridor, tax calculator, fraud call center warning.",
                "Return 3 ranked queries from most specific to safer fallback."
              ].join(" ")
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `title: ${sanitize(item.title, 160)}`,
                `category: ${sanitize(item.category, 40)}`,
                item.sub_interest ? `subInterest: ${sanitize(item.sub_interest, 80)}` : "",
                item.short_summary ? `summary: ${sanitize(item.short_summary, 300)}` : ""
              ].filter(Boolean).join("\n")
            }
          ]
        }
      ]
    });
    const raw = completion.output_text?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const queries = Array.isArray(parsed?.queries) ? parsed.queries : [];
    return queries
      .map((query) => sanitize(query, 80))
      .filter(Boolean)
      .filter((query) => !isGenericQuery(query))
      .slice(0, 3);
  } catch (e) {
    console.warn(`[ai-query] failed for "${item.title}":`, e.message);
    return null;
  }
}

function buildResultRelevance(entry, query, item) {
  const tags = String(entry.tags ?? "").toLowerCase();
  const pageUrl = String(entry.pageURL ?? "").toLowerCase();
  const titleTokens = tokenizeEnglish(item.title);
  const summaryTokens = tokenizeEnglish(item.short_summary);
  const queryTokens = tokenizeEnglish(query);
  const specificTokens = Array.from(new Set([...queryTokens, ...titleTokens.slice(0, 4), ...summaryTokens.slice(0, 4)]))
    .filter((token) => !GENERIC_QUERY_TERMS.has(token));

  const haystack = `${tags} ${pageUrl}`;
  const matches = specificTokens.filter((token) => haystack.includes(token)).length;
  const exactQueryBonus = queryTokens.length > 0 && queryTokens.every((token) => tags.includes(token)) ? 3 : 0;
  return matches * 2 + exactQueryBonus;
}

async function searchPixabay(query, item) {
  if (!env.PIXABAY_API_KEY) return null;
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", env.PIXABAY_API_KEY.trim());
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "10");

  const response = await fetch(url.toString(), { headers: { "user-agent": "sejulachim-thumbnail-refresh/1.0" } });
  if (!response.ok) return null;

  const data = await response.json();
  const scored = (data.hits ?? [])
    .filter((entry) => {
      if (!entry.largeImageURL && !entry.webformatURL) return false;
      const haystack = `${entry.tags ?? ""} ${entry.pageURL ?? ""}`.toLowerCase();
      return !BLOCKED_PIXABAY_TERMS.some((term) => haystack.includes(term));
    })
    .map((entry) => {
      return { entry, score: buildResultRelevance(entry, query, item) };
    })
    .sort((a, b) => b.score - a.score);

  const hit = scored[0]?.entry;
  if (!hit || (scored[0]?.score ?? 0) <= 0) return null;

  return {
    url: hit.webformatURL || hit.largeImageURL,
    alt: sanitize(hit.tags || query, 160),
    pageUrl: hit.pageURL || "",
    author: sanitize(hit.user || "", 80) || null
  };
}

async function searchWikimediaCommons(query) {
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

  const response = await fetch(url.toString(), { headers: { "user-agent": "sejulachim-thumbnail-refresh/1.0" } });
  if (!response.ok) return null;

  const data = await response.json();
  const pages = Object.values(data.query?.pages ?? {});

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl) continue;
    const mime = String(info.mime ?? "").toLowerCase();
    if (!mime.startsWith("image/") || mime.includes("svg") || mime.includes("tiff")) continue;

    return {
      url: info.thumburl,
      alt: sanitize(page.title || query, 160),
      pageUrl: info.descriptionurl,
      author: null
    };
  }

  return null;
}

async function findThumbnail(item) {
  const ai = await aiQueries(item);
  const fallbacks = fallbackQuery(item);
  const queries = [...new Set([...(ai ?? []), ...fallbacks].filter(Boolean))];
  if (queries.length === 0) return null;

  for (const q of queries) {
    if (isGenericQuery(q)) continue;
    const result = (await searchPixabay(q, item)) || (await searchWikimediaCommons(q));
    if (result) return { result, query: q };
  }
  return null;
}

async function main() {
  // --all 플래그: 전체 교체 / 기본: thumbnail_url 없는 것만
  const replaceAll = process.argv.includes("--all");

  let query = supabase
    .from('sj_content_items')
    .select("id, title, category, sub_interest, short_summary, slug, thumbnail_url")
    .order("published_at", { ascending: false });

  if (!replaceAll) {
    query = query.is("thumbnail_url", null);
  }

  const { data: items, error } = await query;
  if (error) throw error;

  console.log(`\n대상: ${items?.length ?? 0}개 (${replaceAll ? "전체 교체" : "썸네일 없는 것만"})\n`);

  const updates = [];
  let skipped = 0;

  for (const item of items ?? []) {
    const found = await findThumbnail(item);
    if (!found) {
      console.warn(`[skip] ${item.slug} — 이미지 없음`);
      skipped++;
      continue;
    }

    const { result, query: usedQuery } = found;
    const isPixabay = result.url.includes("pixabay");
    const permanentUrl = isPixabay ? await rehostToStorage(result.url, item.slug) : result.url;

    const payload = {
      thumbnail_url: permanentUrl,
      thumbnail_alt: result.alt || item.title,
      thumbnail_page_url: result.pageUrl,
      thumbnail_author: result.author,
      thumbnail_license: null,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase.from('sj_content_items').update(payload).eq("id", item.id);
    if (updateError) {
      console.error(`[error] ${item.slug}:`, updateError.message);
      continue;
    }

    console.log(`[ok] ${item.slug} — "${usedQuery}"`);
    updates.push({ slug: item.slug, query: usedQuery, url: result.url });

    // OpenAI rate limit 대응
    if (openai) await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n완료: ${updates.length}개 업데이트, ${skipped}개 스킵`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
