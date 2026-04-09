import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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
  };

  const { error } = await supabase.from("content_items").upsert(row, { onConflict: "slug" });

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
}

console.log(`\n=== 완료: ${inserted}개 삽입, ${failed}개 실패 ===\n`);
