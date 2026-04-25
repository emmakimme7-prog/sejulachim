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
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
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

const slug = "real-2026-04-08-건강-혈압-1";

const update = {
  short_summary:
    "아침 혈압 관리는 거창한 운동보다 기상 직후 습관을 어떻게 잡느냐에 달려 있습니다. 스마트폰을 바로 보지 않고, 호흡과 수분, 음식, 햇빛을 함께 조절하는 방식이 핵심으로 제시됐습니다.",
  long_summary:
    "기사에서 가장 먼저 강조한 것은 기상 직후 스마트폰을 바로 보지 않는 습관입니다. 잠에서 깨자마자 뉴스나 메시지를 확인하면 긴장 반응이 커져 심박수와 혈압이 함께 올라갈 수 있어, 최소 몇 분이라도 화면보다 몸 상태를 먼저 살피는 편이 좋다고 설명합니다.\n\n함께 소개된 방법은 호흡 속도를 천천히 낮추는 것입니다. 특히 들이마시는 시간보다 내쉬는 시간을 더 길게 잡으면 몸을 안정시키는 부교감신경이 활성화돼 혈압이 급하게 오르는 흐름을 누그러뜨리는 데 도움이 될 수 있다고 짚었습니다.\n\n아침에 물 한 잔을 마시는 습관도 중요하게 다뤘습니다. 자는 동안 수분이 빠지면 혈액이 더 끈적해지고 심장 부담이 커질 수 있는데, 기상 직후 수분을 보충하면 혈액 흐름을 조금 더 부드럽게 만들어 혈압 상승을 완화하는 데 도움이 된다는 설명입니다.\n\n식사에서는 소금을 줄이는 것과 함께 칼륨이 풍부한 음식을 챙기는 점이 강조됐습니다. 바나나, 아보카도, 시금치, 콩류처럼 나트륨 배출을 돕는 식품을 아침 시간대 식단에 함께 넣으면 하루 전체 혈압 관리에 더 유리하다고 봤습니다.\n\n마지막으로 아침 햇살을 짧게라도 쬐는 습관이 소개됐습니다. 햇빛이 생체 리듬을 조절하고 자율신경 균형을 맞추는 데 도움이 될 수 있어, 기상 직후 몸을 깨우는 생활 신호로 활용하라는 내용입니다.\n\n전체적으로 이 기사는 혈압 관리가 약이나 운동 하나만의 문제가 아니라, 아침 첫 10분을 어떻게 보내느냐에 따라 하루 리듬이 달라질 수 있다는 점을 보여줍니다. 특히 혈압이 들쑥날쑥하거나 아침 시간대 상승 폭이 큰 사람이라면, 기상 직후 습관부터 차분하게 정리해보는 것이 가장 현실적인 출발점입니다.",
  action_line: "내일 아침에 가장 먼저 바꿀 습관 하나만 정해두세요."
};

const { error } = await supabase
  .from('sj_content_items')
  .update({
    ...update,
    updated_at: new Date().toISOString()
  })
  .eq("slug", slug);

if (error) {
  throw error;
}

console.log(JSON.stringify({ ok: true, slug, update }, null, 2));
