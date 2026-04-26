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

// Common RPC names that some projects have for raw SQL execution
const candidates = ["exec_sql", "execute_sql", "exec", "run_sql", "sql"];
for (const name of candidates) {
  const { data, error } = await supabase.rpc(name, { query: "select 1 as x" });
  if (error) {
    console.log(`rpc ${name}: ${error.message}`);
  } else {
    console.log(`rpc ${name}: SUCCESS`, data);
  }
}
