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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const { data: contentItems, error: selectError } = await supabase.from("content_items").select("id, slug");
  if (selectError) throw selectError;

  const contentIds = (contentItems ?? []).map((row) => row.id);
  const contentSlugs = (contentItems ?? []).map((row) => row.slug).filter(Boolean);

  if (contentIds.length > 0) {
    const { error } = await supabase.from("favorites").delete().in("content_item_id", contentIds);
    if (error) throw error;
  }

  if (contentSlugs.length > 0) {
    const { error } = await supabase.from("favorites").delete().in("content_slug", contentSlugs);
    if (error) throw error;
  }

  const wipeAll = async (table) => {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
  };

  await wipeAll("shared_comments");
  await wipeAll("shared_links");
  await wipeAll("notifications");
  await wipeAll("email_logs");
  await wipeAll("daily_pick_items");
  await wipeAll("daily_picks");
  await wipeAll("job_logs");
  await wipeAll("content_items");

  const { count, error: countError } = await supabase.from("content_items").select("*", { count: "exact", head: true });
  if (countError) throw countError;

  console.log(
    JSON.stringify(
      {
        deletedContentItems: contentIds.length,
        remainingContentItems: count ?? 0
      },
      null,
      2
    )
  );
}

await main();
