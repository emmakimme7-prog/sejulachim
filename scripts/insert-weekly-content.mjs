import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

function loadEnvFile(filename) {
  try {
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
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      entries[key] = value;
    }
    return entries;
  } catch {
    return {};
  }
}

const env = { ...loadEnvFile(".env.local"), ...process.env };
const supabase = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

// ─── 썸네일 생성 ─────────────────────────────────
const BLOCKED_PIXABAY_TERMS = [
  "smoking", "cigarette", "tobacco", "nicotine", "ashtray",
  "vape", "vaping", "cigar", "beer", "alcohol", "wine", "whiskey", "vodka"
];

const SUB_INTEREST_THUMB_KEYWORDS = {
  혈압: "blood pressure monitor", 관절: "joint care", 음식: "healthy meal",
  상식: "doctor advice", 병원: "hospital visit", 연금: "retirement planning",
  세금: "tax documents", 보험: "insurance paperwork", 주의: "fraud warning",
  혜택: "government benefits", 꿀팁: "daily life tips", 가전: "home appliance",
  청소: "home cleaning", 요리: "home cooking", 교통: "public transport",
  "주요 뉴스": "headline news", 경제: "economy news", 정책: "government policy",
  사회: "society issue", 해외: "world news", 가족: "family at home",
  부부: "couple at home", 회사: "office teamwork", 취미: "hobby activity",
  친구: "friends talking"
};

const CATEGORY_THUMB_KEYWORDS = {
  건강: "healthy lifestyle", 돈: "personal finance", 실생활: "daily life tips",
  뉴스: "city news", 관계: "relationships"
};

function sanitize(text, limit = 120) {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
}

async function aiThumbnailQuery(item) {
  if (!openai) return null;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You create concise English search queries for free stock photos. Return only one line of plain text. Use 2 to 6 English words. Avoid brand names, punctuation, and quotes. Prioritize a visually searchable scene that matches the article's specific topic."
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
  } catch { return null; }
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

  const response = await fetch(url.toString(), { headers: { "user-agent": "sejulachim/1.0" } });
  if (!response.ok) return null;
  const data = await response.json();

  const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
  const scored = (data.hits ?? [])
    .filter(e => {
      if (!e.largeImageURL && !e.webformatURL) return false;
      const h = `${e.tags ?? ""} ${e.pageURL ?? ""}`.toLowerCase();
      return !BLOCKED_PIXABAY_TERMS.some(t => h.includes(t));
    })
    .map(e => ({ entry: e, score: queryTokens.filter(t => (e.tags ?? "").toLowerCase().includes(t)).length }))
    .sort((a, b) => b.score - a.score);

  const hit = scored[0]?.entry;
  if (!hit) return null;
  return {
    url: hit.webformatURL || hit.largeImageURL,
    alt: sanitize(hit.tags || query, 160),
    pageUrl: hit.pageURL || "",
    author: sanitize(hit.user || "", 80) || null
  };
}

async function findThumbnail(item) {
  const ai = await aiThumbnailQuery(item);
  const sub = item.sub_interest ? SUB_INTEREST_THUMB_KEYWORDS[item.sub_interest] : null;
  const cat = CATEGORY_THUMB_KEYWORDS[item.category] ?? "daily lifestyle";
  const queries = [...new Set([ai, sub, cat].filter(Boolean))];

  for (const q of queries) {
    const result = await searchPixabay(q);
    if (result) return result;
  }
  return null;
}

const STORED_CATEGORY_MAP = {
  건강: "건강",
  돈: "돈",
  실생활: "취미",
  뉴스: "뉴스",
  관계: "가족",
};

const CATEGORY_SLUG_MAP = {
  건강: "health",
  돈: "money",
  실생활: "daily",
  뉴스: "news",
  관계: "relation",
};

const SUB_INTEREST_SLUG_MAP = {
  혈압: "blood-pressure", 관절: "joint", 음식: "food", 상식: "common-sense", 병원: "hospital",
  연금: "pension", 세금: "tax", 보험: "insurance", 주의: "warning", 혜택: "benefit",
  꿀팁: "tips", 가전: "appliance", 청소: "cleaning", 요리: "cooking", 교통: "traffic",
  "주요 뉴스": "top-news", 경제: "economy", 정책: "policy", 사회: "society", 해외: "global",
  가족: "family", 부부: "couple", 회사: "office", 취미: "hobby", 친구: "friend",
};

const slugCounters = {};

function buildSlug(item) {
  const catSlug = CATEGORY_SLUG_MAP[item.category] ?? "brief";
  const subSlug = SUB_INTEREST_SLUG_MAP[item.sub_interest] ?? "sub";
  const key = `${item.date}-${catSlug}-${subSlug}`;
  slugCounters[key] = (slugCounters[key] || 0) + 1;
  return `brief-${item.date}-${catSlug}-${subSlug}-${slugCounters[key]}`;
}

function buildPublishedAt(date, index) {
  const base = new Date(`${date}T07:00:00+09:00`);
  base.setMinutes(base.getMinutes() + index * 3);
  return base.toISOString();
}

const dataPath = resolve(process.cwd(), process.argv[2] || "scripts/weekly-content-data.json");
const allContent = JSON.parse(readFileSync(dataPath, "utf8"));

console.log(`\n=== 세줄아침 일주일치 콘텐츠 삽입 ===`);
console.log(`총 ${allContent.length}개 콘텐츠\n`);

let inserted = 0;
let failed = 0;
let globalIndex = 0;

for (const item of allContent) {
  const slug = buildSlug(item);
  const storedCategory = STORED_CATEGORY_MAP[item.category] ?? item.category;

  // 썸네일 생성
  const thumb = await findThumbnail(item);

  const row = {
    title: item.title,
    category: storedCategory,
    sub_interest: item.sub_interest,
    source_name: item.source_name,
    source_url: item.source_url,
    sources: [{ name: item.source_name, url: item.source_url, type: "news" }],
    raw_text: `원문 제목: ${item.title}\n출처: ${item.source_name}`,
    short_summary: item.short_summary,
    long_summary: item.long_summary,
    action_line: item.action_line,
    summary_type: item.summary_type,
    approval_status: "approved",
    ai_status: "completed",
    summary_status: "done",
    published_at: buildPublishedAt(item.date, globalIndex % 15),
    slug,
    updated_at: new Date().toISOString(),
    ...(thumb ? {
      thumbnail_url: thumb.url,
      thumbnail_alt: thumb.alt,
      thumbnail_page_url: thumb.pageUrl,
      thumbnail_author: thumb.author,
    } : {}),
  };

  const { error } = await supabase.from('sj_content_items').upsert(row, { onConflict: "slug" });

  if (error) {
    console.error(`  ✗ ${item.title}: ${error.message}`);
    failed++;
  } else {
    inserted++;
  }

  globalIndex++;
  if (inserted % 15 === 0 && inserted > 0) {
    console.log(`  ✓ ${inserted}개 삽입 완료...`);
  }
  // OpenAI rate limit 대응
  if (openai) await new Promise((r) => setTimeout(r, 300));
}

console.log(`\n=== 완료: ${inserted}개 삽입, ${failed}개 실패 ===\n`);
