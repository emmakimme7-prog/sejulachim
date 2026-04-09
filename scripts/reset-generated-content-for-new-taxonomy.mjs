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

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.CRON_SECRET) {
  throw new Error("SUPABASE_OR_CRON_ENV_MISSING");
}

const approved = env.ALLOW_PRODUCTION_CONTENT_SEED?.trim().toLowerCase();
if (!["1", "true", "yes", "on"].includes(approved || "")) {
  throw new Error("ALLOW_PRODUCTION_CONTENT_SEED=true 설정 후 다시 실행하세요.");
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function formatKstDate(date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

async function callLocalCron(path) {
  const response = await fetch(`http://127.0.0.1:3301${path}`, {
    method: "POST",
    headers: {
      "x-cron-secret": env.CRON_SECRET
    }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`CRON_FAILED ${path} ${response.status} ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function main() {
  const { data: generatedItems, error: generatedItemsError } = await supabase
    .from("content_items")
    .select("id")
    .eq("source_name", "세줄아침 자동생성");

  if (generatedItemsError) {
    throw generatedItemsError;
  }

  const generatedIds = (generatedItems ?? []).map((item) => item.id);

  if (generatedIds.length > 0) {
    const { error: dailyPickItemsDeleteError } = await supabase
      .from("daily_pick_items")
      .delete()
      .in("content_item_id", generatedIds);
    if (dailyPickItemsDeleteError) {
      throw dailyPickItemsDeleteError;
    }

    const { error: contentDeleteError } = await supabase.from("content_items").delete().in("id", generatedIds);
    if (contentDeleteError) {
      throw contentDeleteError;
    }
  }

  const { error: dailyPicksDeleteError } = await supabase
    .from("daily_picks")
    .delete()
    .gte("pick_date", formatKstDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)));
  if (dailyPicksDeleteError) {
    throw dailyPicksDeleteError;
  }

  const generationResults = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const targetDate = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    const date = formatKstDate(targetDate);
    const result = await callLocalCron(`/api/cron/generate-content?date=${date}`);
    generationResults.push(result);
  }

  const dailyPickResult = await callLocalCron("/api/cron/generate-daily-pick");

  console.log(
    JSON.stringify(
      {
        ok: true,
        generatedDates: generationResults,
        dailyPick: dailyPickResult
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
