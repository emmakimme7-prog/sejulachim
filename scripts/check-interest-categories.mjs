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

console.log("=== user_interest_selections 카테고리 분포 ===");
const { data: interests, error: e1 } = await supabase
  .from("user_interest_selections")
  .select("main_interest");
if (e1) {
  console.error("error:", e1);
} else {
  const counts = {};
  for (const row of interests ?? []) {
    counts[row.main_interest] = (counts[row.main_interest] ?? 0) + 1;
  }
  console.log(counts);
}

console.log("\n=== content_items 카테고리 분포 ===");
const { data: contents, error: e2 } = await supabase
  .from("content_items")
  .select("category");
if (e2) {
  console.error("error:", e2);
} else {
  const counts = {};
  for (const row of contents ?? []) {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }
  console.log(counts);
}

console.log("\n=== 새 카테고리 (코드): 건강, 돈, 실생활, 뉴스, 관계 ===");
console.log("=== 옛 카테고리 (DB check): 건강, 돈, 뉴스, 취미, 가족 ===");
