/**
 * coupang_product_cache 테이블 생성
 * node scripts/setup-product-cache-table.mjs
 */
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

const sql = `
CREATE TABLE IF NOT EXISTS coupang_product_cache (
  keyword TEXT PRIMARY KEY,
  products JSONB NOT NULL DEFAULT '[]',
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
`;

const { error } = await supabase.rpc("exec_sql", { sql }).catch(() => ({ error: { message: "rpc not available" } }));

if (error) {
  // rpc가 없으면 직접 안내
  console.log("Supabase SQL Editor에서 아래 쿼리를 실행하세요:\n");
  console.log(sql);
} else {
  console.log("✓ coupang_product_cache 테이블 생성 완료");
}
