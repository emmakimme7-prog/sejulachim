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

const updates = [
  {
    slug: "brief-2026-04-06-health-common-sense-1",
    title: "슬립맥싱, 수면을 극대화하는 기술",
    short_summary:
      "국민일보 기고문은 슬립맥싱을 단순히 오래 자는 습관이 아니라 수면 환경과 취침 전 루틴까지 함께 조정하는 흐름으로 설명했습니다. 스마트폰과 카페인, 야식처럼 잠을 깨우는 자극을 줄이는 기본 습관이 핵심으로 제시됐습니다.",
    long_summary:
      "국민일보에 실린 김상돈 해운대자생한방병원장 기고문은 슬립맥싱을 수면 시간을 늘리는 기술이 아니라 잠들기 전후 생활 전체를 조정하는 방식으로 풀었습니다.\n\n기사에서는 국내 불면증 환자가 계속 늘고 있다는 점을 먼저 짚으면서, 수면 문제가 다음날 피로에 그치지 않고 혈압과 혈당 같은 만성질환 관리에도 영향을 줄 수 있다고 설명했습니다.\n\n함께 소개된 핵심은 잠자리에 들기 전 자극을 줄이는 순서입니다. 카페인과 알코올 섭취를 늦은 시간까지 끌고 가지 말고, 가벼운 운동과 명상, 미지근한 샤워처럼 몸을 천천히 가라앉히는 루틴을 붙여야 한다는 내용입니다.\n\n야식과 스마트폰 사용을 줄이라는 대목도 비중 있게 다뤄졌습니다. 잠들기 직전까지 화면을 보거나 늦은 밤 음식을 먹으면 몸이 쉬는 신호를 받기 어려워져 수면의 깊이가 떨어질 수 있다는 설명입니다.\n\n기사 후반부에서는 불면이 길어질 때는 생활습관만으로 버티지 말고 전문 진료를 함께 고려해야 한다고 짚었습니다. 유행하는 수면 트렌드를 따라가는 것보다 내 생활에서 잠을 방해하는 자극을 먼저 걷어내는 편이 더 현실적인 출발점이라는 메시지가 분명했습니다.",
    action_line: "오늘 밤에는 잠들기 1시간 전 스마트폰을 멀리 두는 것부터 정해보세요.",
    source_name: "국민일보",
    source_url: "https://www.kmib.co.kr/article/view.asp?arcid=0029620712",
    sources: [
      {
        name: "국민일보",
        url: "https://www.kmib.co.kr/article/view.asp?arcid=0029620712",
        type: "news"
      }
    ],
    raw_text:
      "원문 제목: 잠 못 드는 현대인들, ‘슬립 맥싱’ 열풍\n원문 요약: 최근 수면의 가치를 극대화하는 슬립 맥싱 트렌드가 확산되고 있으며, 스마트폰 사용 확대와 스트레스로 불면증을 겪는 현대인이 늘고 있다고 설명합니다. 카페인과 알코올을 줄이고 가벼운 운동, 명상, 미지근한 샤워, 야식과 스마트폰 사용 자제가 생활습관 관리의 핵심으로 제시됐습니다.\n출처: 국민일보\n작성자: 김상돈 해운대자생한방병원장"
  },
  {
    slug: "brief-2026-04-07-health-food-1",
    title: "두유 vs 귀리우유, 혈당 반응 차이",
    short_summary:
      "헬스조선은 귀리 음료가 다른 식물성 음료보다 탄수화물 비중이 높아 혈당 관리 중이라면 섭취량과 타이밍을 더 따져야 한다고 전했습니다. 한국소비자원 자료까지 보면 두유도 제품마다 당류 차이가 커서 이름보다 영양성분표를 먼저 보는 편이 중요합니다.",
    long_summary:
      "헬스조선은 귀리 음료가 유당이 없고 열량이 낮다는 장점이 있지만, 다른 식물성 음료보다 탄수화물 함량이 많아 혈당 조절 중이라면 주의가 필요하다고 설명했습니다.\n\n기사에서는 귀리 음료가 곡물을 곱게 분쇄한 형태라 흡수 속도가 빠를 수 있고, 단백질과 지방이 상대적으로 적어 혈당을 더 크게 흔들 수 있다고 짚었습니다. 공복에 단독으로 마시기보다 식사와 함께 먹거나 무가당 제품을 고르는 쪽이 낫다는 조언도 함께 실렸습니다.\n\n두유는 무조건 안전하다고 묶어 말하기보다 제품별 차이를 봐야 합니다. 한국소비자원은 2015년 보도자료에서 200mL 기준 두유의 당류 함량이 제품에 따라 5.2g에서 10.9g까지 벌어졌다고 밝혔고, 당류와 칼슘 차이가 꽤 크다고 설명했습니다.\n\n같은 두유라도 앞면 문구만 보면 실제 당 함량을 놓치기 쉬워집니다. 검은콩두유와 흰콩두유 모두 제품별 편차가 있었기 때문에, 혈당이 신경 쓰인다면 제품명보다 당류와 단백질 수치를 같이 확인하는 편이 더 정확합니다.\n\n결국 이 주제의 핵심은 두유가 좋고 귀리우유가 나쁘다는 식의 단순 비교가 아닙니다. 지금 마시는 식물성 음료가 내 식사 패턴과 혈당 관리 목표에 맞는지, 그리고 제품마다 당류가 얼마나 다른지를 확인하는 습관이 먼저라는 점이 더 중요합니다.",
    action_line: "식물성 음료를 고를 때는 제품 앞면보다 영양성분표의 당류와 단백질부터 먼저 보세요.",
    source_name: "헬스조선",
    source_url: "https://m.health.chosun.com/svc/news_view.html?contid=2026012003254",
    sources: [
      {
        name: "헬스조선",
        url: "https://m.health.chosun.com/svc/news_view.html?contid=2026012003254",
        type: "news"
      },
      {
        name: "한국소비자원",
        url: "https://www.kca.go.kr/home/sub.do?menukey=4002&mode=view&no=1001789077&page=60",
        type: "public"
      }
    ],
    raw_text:
      "원문 제목: 칼로리 낮은 귀리 음료… 자칫 혈당 쭉 오를 수도, 왜?\n원문 요약: 귀리 음료는 유당이 없고 열량이 낮지만 다른 식물성 음료보다 탄수화물 함량이 많고 흡수 속도가 빨라 혈당 조절 중이라면 주의가 필요하다고 설명합니다. 공복보다 식후에 마시고 무가당 제품을 고르는 편이 낫다고 전했습니다.\n보조 자료: 한국소비자원은 두유 14개 제품을 시험 평가한 결과 200mL 기준 당류 함량이 5.2g에서 10.9g까지 차이 났다고 밝혔습니다.\n출처: 헬스조선, 한국소비자원"
  }
];

for (const item of updates) {
  const { error, count } = await supabase
    .from("content_items")
    .update({
      title: item.title,
      short_summary: item.short_summary,
      long_summary: item.long_summary,
      action_line: item.action_line,
      source_name: item.source_name,
      source_url: item.source_url,
      sources: item.sources,
      raw_text: item.raw_text,
      updated_at: new Date().toISOString()
    }, { count: "exact" })
    .eq("slug", item.slug);

  if (error) {
    throw error;
  }

  console.log(JSON.stringify({ ok: true, slug: item.slug, updated: count ?? 0 }, null, 2));
}
