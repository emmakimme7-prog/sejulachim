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

const env = { ...loadEnvFile(".env.local"), ...process.env };
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// MAPPING: old → new
const MAPPING = {
  가족: "관계",
  취미: "실생활"
};

console.log("=== content_items 카테고리 마이그레이션 시작 ===");
console.log("매핑:", MAPPING);

for (const [oldCat, newCat] of Object.entries(MAPPING)) {
  const { count: beforeCount, error: countErr } = await supabase
    .from('sj_content_items')
    .select("id", { count: "exact", head: true })
    .eq("category", oldCat);
  if (countErr) {
    console.error(`[${oldCat}] count failed:`, countErr.message);
    continue;
  }
  console.log(`[${oldCat}] → [${newCat}]: ${beforeCount}개 row 업데이트 예정`);

  const { error: updateErr } = await supabase
    .from('sj_content_items')
    .update({ category: newCat })
    .eq("category", oldCat);
  if (updateErr) {
    console.error(`[${oldCat}] update failed:`, updateErr.message);
    console.log("   → DB CHECK 제약 때문에 실패한 것일 수 있음. 먼저 DDL 마이그레이션이 필요합니다.");
    continue;
  }
  console.log(`[${oldCat}] → [${newCat}]: ✅ 완료`);
}

console.log("\n=== 마이그레이션 후 분포 ===");
const { data: contents } = await supabase.from('sj_content_items').select("category");
const counts = {};
for (const row of contents ?? []) {
  counts[row.category] = (counts[row.category] ?? 0) + 1;
}
console.log(counts);
