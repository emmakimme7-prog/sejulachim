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
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
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

const BLOCKED_SOURCE_NAMES = [
  "sports.donga.com",
  "sportsseoul.com",
  "스포츠서울",
  "스포츠동아",
  "무서운이야기",
  "괴담",
  "뉴스초대석",
  "한국뉴스TV"
];

const NOISY_PATTERNS = [
  /괴담/iu,
  /정체 밝혀/iu,
  /얼굴 만지는 손/iu,
  /뭐길래/iu,
  /충격/iu,
  /독주/iu,
  /껑충/iu,
  /탈락/iu,
  /뉴스초대석/iu,
  /오늘의 주요뉴스/iu,
  /한국뉴스\s*TV/iu,
  /브리핑/iu
];

function sanitize(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function extractField(rawText, label) {
  const match = rawText.match(new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\s*원문 제목:|\\s*원문 요약:|\\s*출처:|$)`));
  return sanitize(match?.[1] ?? "");
}

function isBlockedSourceName(sourceName) {
  const value = sanitize(sourceName).toLowerCase();
  return BLOCKED_SOURCE_NAMES.some((blocked) => value.includes(blocked.toLowerCase()));
}

function isNoisyText(value) {
  const text = sanitize(value);
  return NOISY_PATTERNS.some((pattern) => pattern.test(text));
}

function isMismatchedContent(item) {
  const sourceTitle = extractField(item.raw_text ?? "", "원문 제목");
  const sourceSummary = extractField(item.raw_text ?? "", "원문 요약");
  const combinedSource = `${item.source_name ?? ""} ${sourceTitle} ${sourceSummary}`;
  const combinedGenerated = `${item.title ?? ""} ${item.short_summary ?? ""} ${item.long_summary ?? ""}`;

  if (isBlockedSourceName(item.source_name)) return true;
  if (isNoisyText(combinedSource)) return true;

  if (/괴담|공포|정체/iu.test(combinedSource) && /가족|부부|친구|혈압|보험|연금|혜택/iu.test(combinedGenerated)) {
    return true;
  }

  return false;
}

async function main() {
  const { data, error } = await supabase
    .from('sj_content_items')
    .select("id, slug, title, source_name, raw_text, short_summary, long_summary")
    .eq("approval_status", "approved");

  if (error) throw error;

  const rows = data ?? [];
  const targets = rows.filter(isMismatchedContent);

  if (targets.length === 0) {
    console.log(JSON.stringify({ deleted: 0, sample: [] }, null, 2));
    return;
  }

  const ids = targets.map((item) => item.id);
  const slugs = targets.map((item) => item.slug).filter(Boolean);

  if (ids.length > 0) {
    const { error: favoriteByIdError } = await supabase.from('sj_favorites').delete().in("content_item_id", ids);
    if (favoriteByIdError) throw favoriteByIdError;
  }

  if (slugs.length > 0) {
    const { error: favoriteBySlugError } = await supabase.from('sj_favorites').delete().in("content_slug", slugs);
    if (favoriteBySlugError) throw favoriteBySlugError;
  }

  const { data: sharedLinks, error: sharedLinksSelectError } = await supabase.from('sj_shared_links').select("share_key, slugs");
  if (sharedLinksSelectError) throw sharedLinksSelectError;

  const linkedShareKeys = (sharedLinks ?? [])
    .filter((item) => Array.isArray(item.slugs) && item.slugs.some((slug) => slugs.includes(slug)))
    .map((item) => item.share_key)
    .filter(Boolean);

  if (linkedShareKeys.length > 0) {
    const { error: sharedCommentsError } = await supabase.from('sj_shared_comments').delete().in("share_key", linkedShareKeys);
    if (sharedCommentsError) throw sharedCommentsError;

    const { error: sharedLinksError } = await supabase.from('sj_shared_links').delete().in("share_key", linkedShareKeys);
    if (sharedLinksError) throw sharedLinksError;
  }

  const { error: deleteError } = await supabase.from('sj_content_items').delete().in("id", ids);
  if (deleteError) throw deleteError;

  console.log(
    JSON.stringify(
      {
        deleted: targets.length,
        sample: targets.slice(0, 10).map((item) => ({
          slug: item.slug,
          title: item.title,
          source_name: item.source_name
        }))
      },
      null,
      2
    )
  );
}

await main();
