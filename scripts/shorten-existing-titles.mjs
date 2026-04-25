import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filename) {
  const raw = readFileSync(resolve(process.cwd(), filename), "utf8");
  const env = {};

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
    env[key] = value;
  }

  return env;
}

const env = {
  ...loadEnvFile(".env.local"),
  ...process.env
};

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.OPENAI_API_KEY) {
  throw new Error("SUPABASE_OR_OPENAI_ENV_MISSING");
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

function fallbackShortTitle(title) {
  return String(title ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 14);
}

async function shortenTitle(title, category, subInterest) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "당신은 한국어 생활 브리핑 편집자입니다.",
            "긴 제목을 핵심 키워드 2개 이상이 남는 8~12자 안팎의 짧은 명사형 제목으로 줄이세요.",
            "주제와 초점이 함께 보여야 합니다. 예: '연금수령 안내문', '식후 걷기 루틴', '생활비 점검표'.",
            "한 단어만 남기지 말고, 동사형과 설명형, 조사 남발은 금지합니다.",
            "JSON만 반환하세요. 형식: {\"title\":\"...\"}"
          ].join(" ")
        },
        {
          role: "user",
          content: `원제목: ${title}\n카테고리: ${category}\n세부카테고리: ${subInterest ?? ""}`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return fallbackShortTitle(title);
    }

    const parsed = JSON.parse(raw);
    return fallbackShortTitle(parsed.title || title);
  } catch {
    return fallbackShortTitle(title);
  }
}

async function main() {
  const { data: items, error } = await supabase
    .from('sj_content_items')
    .select("id, title, category, sub_interest, slug")
    .order("published_at", { ascending: false });

  if (error) {
    throw error;
  }

  const updates = [];

  for (const item of items ?? []) {
    const nextTitle = await shortenTitle(item.title, item.category, item.sub_interest);
    if (!nextTitle || nextTitle === item.title) {
      continue;
    }

    const { error: updateError } = await supabase
      .from('sj_content_items')
      .update({ title: nextTitle, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (updateError) {
      throw updateError;
    }

    updates.push({
      slug: item.slug,
      from: item.title,
      to: nextTitle
    });
  }

  console.log(JSON.stringify({ ok: true, updated: updates.length, samples: updates.slice(0, 12) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
