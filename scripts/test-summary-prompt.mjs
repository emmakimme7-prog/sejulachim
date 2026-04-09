import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import OpenAI from "openai";

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

if (!env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY_MISSING");
}

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const system = [
  "당신은 한국어 아침 브리핑 편집자입니다.",
  "반드시 제공된 원문 안에서만 요약하세요.",
  "출처에 없는 사실, 숫자, 조언을 만들지 마세요.",
  "짧고 공손한 한국어를 사용하세요.",
  "공포를 조장하지 말고, 의료/법률/금융 확정 표현을 피하세요.",
  "title은 9~13자 안팎의 짧은 명사형 제목으로 작성하세요.",
  "반드시 원문 제목에 나온 고유명사·기관명·제도명·지역명 중 가장 중요한 것 1개를 살리고, 그 뒤에 핵심 주제어 1개를 붙이세요.",
  "예: 국민연금 수급연령, 모바일신분증 확인, 서울버스 노선개편, 고혈압 약 복용법.",
  "금지: 한 단어 제목, 안내, 변경, 절차, 기준, 대책처럼 너무 뭉툭한 제목, 동사 종결형, ~하는 방법, ~의 효과.",
  "shortSummary는 1~2문장으로, 누가 무엇을 바꾸거나 알렸는지와 왜 확인이 필요한지를 분명하게 적으세요.",
  "longSummary는 4~6문장으로 짧고 선명하게 작성하세요. 배경 설명은 최소화하고, 실제 변경점·확인 포인트·생활 영향 위주로 요약하세요.",
  "JSON만 반환하세요. 키는 title, shortSummary, longSummary, actionLine, summaryType 입니다."
].join(" ");

const samples = [
  {
    label: "연금",
    user: `제목: 국민연금 수급 개시 연령과 조기수령 조건 변경 안내
카테고리: 돈
요약 유형: MUST
원문 핵심:
원문 제목: 국민연금 수급 개시 연령과 조기수령 조건 변경 안내
원문 요약: 국민연금공단은 2026년 4월부터 출생연도에 따라 수급 개시 연령과 조기노령연금 신청 가능 시점을 다시 안내한다고 밝혔다. 신청 전 예상 감액률과 소득 기준을 함께 확인해야 하며, 온라인 예상연금 조회 서비스도 개편됐다.
출처: 국민연금공단`
  },
  {
    label: "병원",
    user: `제목: 병원 진료 전 모바일 신분증 확인 절차 확대
카테고리: 건강
요약 유형: USEFUL
원문 핵심:
원문 제목: 병원 진료 전 모바일 신분증 확인 절차 확대
원문 요약: 보건복지부는 일부 의료기관에서 시행하던 모바일 신분증 확인 절차를 확대 적용한다고 밝혔다. 초진과 재진 여부에 따라 확인 방식이 다를 수 있고, 예외 적용 대상도 함께 안내했다.
출처: 보건복지부`
  },
  {
    label: "교통",
    user: `제목: 서울 버스 노선 조정과 배차 간격 개편 발표
카테고리: 실생활
요약 유형: ACTION
원문 핵심:
원문 제목: 서울 버스 노선 조정과 배차 간격 개편 발표
원문 요약: 서울시는 출퇴근 혼잡 노선의 배차 간격을 조정하고 일부 지선 노선의 운행 구간을 바꾼다고 밝혔다. 시행 시점과 주요 변경 노선은 시 홈페이지와 정류장 안내문을 통해 확인할 수 있다.
출처: 서울시`
  }
];

for (const sample of samples) {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 1200,
    messages: [
      { role: "system", content: system },
      { role: "user", content: sample.user }
    ]
  });

  console.log(`\n--- ${sample.label} ---`);
  console.log(response.choices[0]?.message?.content ?? "");
}
