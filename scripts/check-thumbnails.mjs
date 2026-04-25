import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filename) {
  const filePath = resolve(process.cwd(), filename);
  const raw = readFileSync(filePath, "utf8");
  const entries = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    entries[t.slice(0, i).trim()] = v;
  }
  return entries;
}
const env = { ...loadEnvFile(".env.local"), ...process.env };
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data, count } = await supabase
  .from('sj_content_items')
  .select("id, title, slug, category, thumbnail_url, published_at", { count: "exact" })
  .order("published_at", { ascending: false })
  .limit(15);

console.log(`총 content_items: ${count}`);
console.log("최근 15개 thumbnail_url 상태:");
for (const r of data ?? []) {
  const has = r.thumbnail_url ? "✅" : "❌";
  console.log(`  ${has} ${r.published_at?.slice(0,10)} [${r.category}] ${r.title.slice(0,40)} → ${r.thumbnail_url ? r.thumbnail_url.slice(0,80) : "NULL"}`);
}

// Stats
const { count: withThumb } = await supabase
  .from('sj_content_items')
  .select("id", { count: "exact", head: true })
  .not("thumbnail_url", "is", null);
const { count: noThumb } = await supabase
  .from('sj_content_items')
  .select("id", { count: "exact", head: true })
  .is("thumbnail_url", null);
console.log(`\nthumbnail_url 있음: ${withThumb} / 없음: ${noThumb}`);
