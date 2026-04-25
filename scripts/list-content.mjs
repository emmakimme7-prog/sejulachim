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

const { data, error } = await supabase
  .from('sj_content_items')
  .select("slug, title, category, sub_interest, thumbnail_url")
  .order("published_at", { ascending: false });

if (error) throw error;

for (const item of data) {
  const hasThumb = item.thumbnail_url ? "O" : "X";
  console.log(`[${hasThumb}] ${item.slug} | ${item.category}/${item.sub_interest ?? "-"} | ${item.title}`);
}
console.log(`\n총 ${data.length}개`);
