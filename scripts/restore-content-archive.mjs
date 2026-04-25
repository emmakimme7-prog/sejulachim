import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

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

const approved = env.ALLOW_PRODUCTION_CONTENT_SEED?.trim().toLowerCase();
if (!["1", "true", "yes", "on"].includes(approved || "")) {
  throw new Error("ALLOW_PRODUCTION_CONTENT_SEED=true 설정 후 다시 실행하세요.");
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const CATEGORY_MAP = {
  건강: "건강",
  돈: "돈",
  실생활: "취미",
  뉴스: "뉴스",
  관계: "가족"
};

const CATEGORY_SLUG_MAP = {
  건강: "health",
  돈: "money",
  실생활: "daily",
  뉴스: "news",
  관계: "relation"
};

const SUB_SLUG_MAP = {
  혈압: "blood-pressure",
  관절: "joint",
  음식: "food",
  상식: "common-sense",
  병원: "hospital",
  연금: "pension",
  세금: "tax",
  보험: "insurance",
  주의: "warning",
  혜택: "benefit",
  꿀팁: "tips",
  가전: "appliance",
  청소: "cleaning",
  요리: "cooking",
  교통: "traffic",
  "주요 뉴스": "top-news",
  경제: "economy",
  정책: "policy",
  사회: "society",
  해외: "global",
  가족: "family",
  부부: "couple",
  회사: "office",
  취미: "hobby",
  친구: "friend"
};

function sanitizeSlugPart(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-");
}

function buildSlug(category, subInterest, date) {
  const categorySlug = CATEGORY_SLUG_MAP[category] ?? sanitizeSlugPart(category);
  const subSlug = SUB_SLUG_MAP[subInterest] ?? sanitizeSlugPart(subInterest);
  return `real-${date}-${categorySlug}-${subSlug}-1`;
}

function buildPublishedAt(date, index) {
  const base = new Date(`${date}T07:00:00+09:00`);
  base.setMinutes(base.getMinutes() + index * 3);
  return base.toISOString();
}

function normalizeItems(items) {
  return items.map((item, index) => ({
    sourceDate: item.date,
    slug: buildSlug(item.category, item.sub_interest, item.date),
    title: item.title,
    category: CATEGORY_MAP[item.category] ?? item.category,
    sub_interest: item.sub_interest,
    summary_type: item.summary_type ?? (index % 3 === 0 ? "MUST" : index % 3 === 1 ? "USEFUL" : "ACTION"),
    source_name: item.source_name,
    source_url: item.source_url,
    sources: [{ name: item.source_name, url: item.source_url, type: "news" }],
    short_summary: item.short_summary,
    long_summary: item.long_summary,
    action_line: item.action_line,
    raw_text: item.long_summary,
    approval_status: "approved",
    ai_status: "completed",
    summary_status: "done",
    published_at: buildPublishedAt(item.date, index),
    thumbnail_url: null,
    thumbnail_alt: item.title,
    thumbnail_page_url: item.source_url,
    thumbnail_author: null,
    thumbnail_license: null,
    created_at: buildPublishedAt(item.date, index),
    updated_at: new Date().toISOString()
  }));
}

async function upsertDailyPick(date, rows) {
  const { data: dailyPick, error: dailyPickError } = await supabase
    .from('sj_daily_picks')
    .upsert(
      {
        pick_date: date,
        status: "ready",
        generated_at: `${date}T07:00:00+09:00`
      },
      { onConflict: "pick_date" }
    )
    .select("id")
    .single();
  if (dailyPickError) throw dailyPickError;

  const { error: pickDeleteError } = await supabase.from('sj_daily_pick_items').delete().eq("daily_pick_id", dailyPick.id);
  if (pickDeleteError) throw pickDeleteError;

  const { data: insertedRows, error: insertedRowsError } = await supabase
    .from('sj_content_items')
    .select("id, summary_type, published_at")
    .in("slug", rows.map((row) => row.slug));
  if (insertedRowsError) throw insertedRowsError;

  const byType = {
    MUST: (insertedRows ?? []).filter((row) => row.summary_type === "MUST").sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())[0],
    USEFUL: (insertedRows ?? []).filter((row) => row.summary_type === "USEFUL").sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())[0],
    ACTION: (insertedRows ?? []).filter((row) => row.summary_type === "ACTION").sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())[0]
  };

  const pickItems = [byType.MUST, byType.USEFUL, byType.ACTION].filter(Boolean).map((item, index) => ({
    daily_pick_id: dailyPick.id,
    content_item_id: item.id,
    position: index + 1
  }));

  if (pickItems.length > 0) {
    const { error: pickItemsError } = await supabase.from('sj_daily_pick_items').insert(pickItems);
    if (pickItemsError) throw pickItemsError;
  }
}

async function restoreFile(pathname) {
  const items = JSON.parse(readFileSync(resolve(process.cwd(), pathname), "utf8"));
  const rows = normalizeItems(items);
  const dbRows = rows.map(({ sourceDate, ...row }) => row);
  const { error } = await supabase.from('sj_content_items').upsert(dbRows, { onConflict: "slug" });
  if (error) throw error;

  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.sourceDate]) acc[row.sourceDate] = [];
    acc[row.sourceDate].push(row);
    return acc;
  }, {});

  for (const [date, dateRows] of Object.entries(grouped)) {
    await upsertDailyPick(date, dateRows);
  }

  return rows.length;
}

async function main() {
  const files = [
    "scripts/weekly-content-data.json",
    "scripts/daily-content-data.json",
    "scripts/daily-content-2026-04-10.json",
    "scripts/daily-content-2026-04-11.json"
  ];

  let restoredCount = 0;
  for (const file of files) {
    restoredCount += await restoreFile(file);
  }

  const { count: totalCount, error: countError } = await supabase.from('sj_content_items').select("*", { count: "exact", head: true });
  if (countError) throw countError;

  console.log(JSON.stringify({ ok: true, restoredCount, totalCount: totalCount ?? 0, files }, null, 2));
}

await main();
