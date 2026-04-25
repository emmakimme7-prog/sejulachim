import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import OpenAI from "openai";
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

function sanitize(text, limit = 4000) {
  return String(text ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function getKstDateString(date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

const env = {
  ...loadEnvFile(".env.local"),
  ...process.env
};

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_ENV_MISSING");
}

if (!env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY_MISSING");
}

const TARGET_DATE = process.env.CONTENT_SEED_DATE?.trim() || getKstDateString(new Date());
const SLUG_PREFIX = `real-${TARGET_DATE}-`;

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const systemPrompt = [
  "한국어 아침 브리핑 '세줄아침' 편집자. 원문 안에서만 요약합니다. 출처에 없는 사실, 숫자, 평가, 조언은 만들지 않습니다.",
  "【저작권 준수 필수】원문 문장과 표현을 그대로 베끼지 말고 사실만 추출해 완전히 새로운 문장으로 다시 작성합니다.",
  "title: 8~18자. 너무 뭉뚝한 제목 금지. 원문 핵심 맥락이 살아 있어야 합니다.",
  "금지 제목 예시: 안내, 점검, 핵심, 정보, 흐름, 변화, 요약.",
  "가능하면 고유명사·주제어를 함께 살리되, 제목이 이상하게 잘리지 않게 자연스러운 명사형으로 씁니다.",
  "shortSummary: 2문장. 누가 무엇을 했는지 또는 어떤 변화가 있는지, 왜 확인할 만한지 분명하게 씁니다.",
  "longSummary: 4~6문장. 메타 표현 금지. '기사입니다', '확인해보세요', '흐름입니다' 같은 문장 금지.",
  "actionLine: 한 문장. 독자가 바로 떠올리거나 점검할 수 있는 부드러운 권유형.",
  "summaryType는 입력값을 유지합니다.",
  "JSON만 반환합니다. 키는 title, shortSummary, longSummary, actionLine, summaryType 입니다."
].join("\n");

async function summarizeItem(item) {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 2400,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          `제목: ${sanitize(item.title, 160)}`,
          `카테고리: ${sanitize(item.category, 40)}`,
          `세부카테고리: ${sanitize(item.sub_interest, 40)}`,
          `요약 유형: ${sanitize(item.summary_type, 20)}`,
          `원문 핵심:\n${sanitize(item.raw_text, 4000)}`
        ].join("\n")
      }
    ]
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error(`EMPTY_AI_RESPONSE:${item.slug}`);
  }

  const parsed = JSON.parse(raw);
  return {
    title: sanitize(parsed.title, 30),
    short_summary: sanitize(parsed.shortSummary, 300),
    long_summary: sanitize(parsed.longSummary, 4000),
    action_line: sanitize(parsed.actionLine, 160),
    summary_type: sanitize(parsed.summaryType || item.summary_type, 20)
  };
}

async function main() {
  const { data, error } = await supabase
    .from('sj_content_items')
    .select("id, slug, title, category, sub_interest, raw_text, summary_type")
    .like("slug", `${SLUG_PREFIX}%`)
    .order("published_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const updates = [];

  for (const item of rows) {
    try {
      const summarized = await summarizeItem(item);
      const { error: updateError } = await supabase
        .from('sj_content_items')
        .update({
          ...summarized,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (updateError) throw updateError;
      updates.push({ slug: item.slug, title: summarized.title });
      console.log(`[ok] ${item.slug} -> ${summarized.title}`);
    } catch (error) {
      console.error(`[error] ${item.slug}`, error instanceof Error ? error.message : error);
    }
  }

  console.log(JSON.stringify({ ok: true, count: updates.length, updates }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
