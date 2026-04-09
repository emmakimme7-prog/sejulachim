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

const BLOCKED_PIXABAY_TERMS = [
  "smoking", "cigarette", "cigarettes", "tobacco", "nicotine",
  "ashtray", "vape", "vaping", "cigar", "beer", "alcohol",
  "wine", "whiskey", "vodka"
];

function sanitize(text, limit = 120) {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function fallbackQuery(item) {
  const subKeywords = item.sub_interest ? SUB_INTEREST_KEYWORDS[item.sub_interest] ?? [] : [];
  const categoryKeywords = CATEGORY_KEYWORDS[item.category] ?? ["daily lifestyle"];
  return [...subKeywords, ...categoryKeywords].slice(0, 2);
}

async function aiQuery(item) {
  if (!openai) return null;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
            `title: ${sanitize(item.title, 160)}`,
            `category: ${sanitize(item.category, 40)}`,
            item.sub_interest ? `subInterest: ${sanitize(item.sub_interest, 80)}` : "",
            item.short_summary ? `summary: ${sanitize(item.short_summary, 300)}` : ""
          ].filter(Boolean).join("\n")
        }
      ]
    });
    const q = completion.choices[0]?.message?.content?.trim();
    return q ? sanitize(q, 80) : null;
  } catch (e) {
    console.warn(`[ai-query] failed for "${item.title}":`, e.message);
    return null;
  }
}

async function searchPixabay(query) {
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
  const hit = data.hits?.find((entry) => {
    if (!entry.largeImageURL && !entry.webformatURL) return false;
    const haystack = `${entry.tags ?? ""} ${entry.pageURL ?? ""}`.toLowerCase();
    return !BLOCKED_PIXABAY_TERMS.some((term) => haystack.includes(term));
  });
  if (!hit) return null;

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
  const ai = await aiQuery(item);
  const fallbacks = fallbackQuery(item);
  const queries = [...new Set([ai, ...fallbacks].filter(Boolean))];

  for (const q of queries) {
    const result = (await searchPixabay(q)) || (await searchWikimediaCommons(q));
    if (result) return { result, query: q };
  }
  return null;
}

async function main() {
  // --all 플래그: 전체 교체 / 기본: thumbnail_url 없는 것만
  const replaceAll = process.argv.includes("--all");

  let query = supabase
    .from("content_items")
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
    const payload = {
      thumbnail_url: result.url,
      thumbnail_alt: result.alt || item.title,
      thumbnail_page_url: result.pageUrl,
      thumbnail_author: result.author,
      thumbnail_license: null,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase.from("content_items").update(payload).eq("id", item.id);
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
