// Verify that the application-level mapping works:
// app sends "실생활"/"관계" → DB stores "취미"/"가족" → on read, mapped back.
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

// 1) Find any user (we just need one for FK)
const { data: users } = await supabase.from("users").select("id, email").limit(1);
if (!users || users.length === 0) {
  console.log("no users found");
  process.exit(0);
}
const userId = users[0].id;
console.log("test user:", users[0].email);

// 2) Try the OLD way (direct insert with new category) — should fail
const oldWay = await supabase
  .from("user_interest_selections")
  .insert({ user_id: userId, main_interest: "실생활", sub_interest: null, created_at: new Date().toISOString() });
console.log("\n[direct '실생활' insert] error:", oldWay.error?.message ?? "none");

// 3) Try the NEW way (mapped to '취미') — should succeed
const STORED = { 실생활: "취미", 관계: "가족" };
const cleaned = await supabase
  .from("user_interest_selections")
  .delete()
  .eq("user_id", userId)
  .in("main_interest", ["취미", "가족"]);
console.log("[cleanup test rows] error:", cleaned.error?.message ?? "none");

const mappedWay = await supabase
  .from("user_interest_selections")
  .insert({ user_id: userId, main_interest: STORED["실생활"], sub_interest: null, created_at: new Date().toISOString() });
console.log("[mapped '실생활' → '취미' insert] error:", mappedWay.error?.message ?? "none");

// 4) Read back and verify
const { data: rows } = await supabase
  .from("user_interest_selections")
  .select("main_interest, sub_interest")
  .eq("user_id", userId);
console.log("\n[stored rows]", rows);
const DISPLAY = { 취미: "실생활", 가족: "관계" };
console.log("[mapped to display]", rows?.map((r) => DISPLAY[r.main_interest] ?? r.main_interest));

// cleanup the test row
await supabase.from("user_interest_selections").delete().eq("user_id", userId).eq("main_interest", "취미");
console.log("\n[cleanup done]");
