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

const { count, error } = await supabase
  .from('sj_coupang_product_cache')
  .select("keyword", { count: "exact", head: true });

if (error) {
  console.log("테이블 없음:", error.message);
  console.log("\nSupabase SQL Editor에서 아래 쿼리 실행하세요:\n");
  console.log(`CREATE TABLE IF NOT EXISTS coupang_product_cache (
  keyword TEXT PRIMARY KEY,
  products JSONB NOT NULL DEFAULT '[]',
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS coupang_deeplink_cache (
  original_url TEXT PRIMARY KEY,
  shorten_url TEXT NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);`);
} else {
  const { count: deeplinkCount } = await supabase
    .from("coupang_deeplink_cache")
    .select("original_url", { count: "exact", head: true })
    .catch(() => ({ count: 0 }));
  console.log(`테이블 있음, 상품 캐시: ${count}개, 딥링크 캐시: ${deeplinkCount ?? 0}개`);
}
