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

const STOPWORDS = new Set([
  "오늘의",
  "뉴스",
  "관련",
  "핵심",
  "발표",
  "확대",
  "운영",
  "실시",
  "정례화",
  "본격",
  "가동",
  "당부",
  "선발",
  "지원",
  "모집",
  "도입",
  "개편",
  "수상",
  "역대",
  "최대",
  "희망하며",
  "보니",
  "찾아",
  "앞둔",
  "예비후보",
  "정책",
  "승부"
]);

const BLOCKED_SOURCE_NAMES = new Set([
  "네이트",
  "다음",
  "네이버",
  "뉴스버스",
  "데일리바이트(DAILY BYTE)"
]);

const GENERIC_TITLE_TOKENS = new Set([
  "핵심",
  "포인트",
  "안내",
  "정보",
  "흐름",
  "변화",
  "점검",
  "체크",
  "요약",
  "기사"
]);

const KEYWORD_TITLE_MAP = {
  가족: [
    ["가족심리", "가족심리 지원"],
    ["가족관계검진", "가족관계 검진"],
    ["양육", "양육가족 지원"],
    ["가족", "가족돌봄 안내"]
  ],
  부부: [
    ["가사", "부부 가사분담"],
    ["부부", "부부관계 점검"]
  ],
  회사: [
    ["청렴", "공무원 청렴소통"],
    ["월급", "직장 월급분쟁"],
    ["노조", "노조 소통정례"],
    ["상사", "직장 상사갈등"]
  ],
  취미: [
    ["산", "등산인기 흐름"],
    ["문화", "문화취미 흐름"],
    ["취미", "취미생활 흐름"]
  ],
  친구: [["친구", "친구관계 점검"]],
  연금: [
    ["국민연금", "국민연금 수급기준"],
    ["기초연금", "기초연금 사각지대"],
    ["퇴직연금", "퇴직연금 운용변화"],
    ["연금", "연금수급 기준"]
  ],
  세금: [
    ["홈택스", "홈택스 신고안내"],
    ["종합소득세", "종소세 신고기한"],
    ["절세", "절세신고 포인트"],
    ["세금", "세금신고 안내"]
  ],
  보험: [
    ["공황장애", "마음건강 보험"],
    ["번아웃", "마음건강 보험"],
    ["실손", "실손보험 보장범위"],
    ["보험", "보험보장 점검"]
  ],
  주의: [
    ["보이스피싱", "보이스피싱 주의"],
    ["사기", "금융사기 주의"],
    ["주의", "소비자주의 정보"]
  ],
  혜택: [
    ["보험료 지원", "청년 보험료 지원"],
    ["국민연금공단", "청년 지원 혜택"],
    ["복지", "복지혜택 안내"],
    ["지원", "맞춤지원 혜택"],
    ["혜택", "지원혜택 정보"]
  ],
  혈압: [
    ["건강 루틴 5가지", "혈압 관리 루틴"],
    ["무릎 삐끗", "중년 봄 건강"],
    ["고혈압", "고혈압 관리정보"],
    ["혈압", "혈압관리 포인트"]
  ],
  관절: [
    ["어깨 통증", "어깨 통증 점검"],
    ["무릎", "무릎관절 관리"],
    ["관절", "관절건강 정보"]
  ],
  음식: [
    ["튀김", "튀김 건강조리"],
    ["식품", "건강식품 경쟁"],
    ["식단", "식단관리 포인트"],
    ["음식", "음식선택 기준"]
  ],
  상식: [
    ["임플란트", "임플란트 판단기준"],
    ["건강상식", "건강상식 체크"],
    ["치아", "자연치아 보존"],
    ["건강", "생활건강 상식"]
  ],
  병원: [
    ["모바일 신분증", "모바일신분증 확인"],
    ["진료", "병원진료 안내"],
    ["병원", "병원이용 안내"]
  ],
  꿀팁: [
    ["정리", "생활정리 팁"],
    ["꿀팁", "생활꿀팁 정리"],
    ["정보", "생활정보 요약"]
  ],
  가전: [
    ["가전", "가전관리 팁"],
    ["전자제품", "가전사용 점검"]
  ],
  청소: [
    ["청소", "청소정리 팁"],
    ["정리", "정리수납 요령"]
  ],
  요리: [
    ["레시피", "집밥레시피 팁"],
    ["요리", "간단요리 정보"]
  ],
  교통: [
    ["버스", "서울버스 노선조정"],
    ["지하철", "지하철 운행정보"],
    ["교통", "교통변경 확인"]
  ],
  "주요 뉴스": [
    ["세종", "세종 현안점검"],
    ["주요", "오늘 주요현안"]
  ],
  경제: [
    ["삼성전자", "삼성전자 실적"],
    ["LG유플러스", "LG 금융AI 협력"],
    ["LG", "LG 투자행보"],
    ["경제", "경제이슈 점검"]
  ],
  정책: [
    ["연금", "연금정책 변화"],
    ["비전", "지역정책 공약"],
    ["정책", "정책발표 핵심"]
  ],
  사회: [
    ["환경정화", "분양 앞 환경정화"],
    ["도로명주소", "도로명주소 교육"],
    ["성교육", "체험성교육 확대"],
    ["기관평가", "기관평가 대상"],
    ["사회", "생활사회 이슈"]
  ],
  해외: [
    ["해외", "해외뉴스 요약"],
    ["국제", "국제이슈 점검"]
  ]
};

function sanitize(text, limit = 300) {
  return String(text ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function extractField(rawText, label) {
  const match = rawText.match(new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\s*원문 제목:|\\s*원문 요약:|\\s*출처:|$)`));
  return sanitize(match?.[1] ?? "", 1000);
}

function cleanHeadline(text, sourceName = "") {
  return sanitize(text, 200)
    .replace(/^\[[^\]]+\]\s*/g, "")
    .replace(/\[(기고|칼럼|사설|오피니언|기자수첩)[^\]]*\]/giu, " ")
    .replace(/\{(기고|칼럼|사설|오피니언|기자수첩)[^}]*\}/giu, " ")
    .replace(/\((기고|칼럼|사설|오피니언|기자수첩)[^)]*\)/giu, " ")
    .replace(/(기고|칼럼|사설|오피니언|기자수첩)\s*\/?\s*[가-힣A-Za-z]+/giu, " ")
    .replace(/한눈에 보는 오늘의 뉴스/giu, " ")
    .replace(/오늘의 경제뉴스/giu, " ")
    .replace(/\d{4}년\s*\d{1,2}월\s*\d{1,2}일자/giu, " ")
    .replace(/[“”"'`]/g, "")
    .replace(/[>]/g, " ")
    .replace(/[()]/g, " ")
    .replace(/[…·]/g, " ")
    .replace(/\b[A-Za-z0-9.-]+\.(com|co\.kr|kr|net|org)\b/gi, "")
    .replace(new RegExp(sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSummaryText(text, sourceName = "") {
  return sanitize(text, 400)
    .replace(/원문 제목:\s*/giu, " ")
    .replace(/원문 요약:\s*/giu, " ")
    .replace(/출처:\s*[^\s]+/giu, " ")
    .replace(/카테고리:\s*[^\s]+/giu, " ")
    .replace(/세부카테고리:\s*[^\s]+/giu, " ")
    .replace(/\[(기고|칼럼|사설|오피니언|기자수첩)[^\]]*\]/giu, " ")
    .replace(/\b[A-Za-z0-9.-]+\.(com|co\.kr|kr|net|org)\b/gi, " ")
    .replace(new RegExp(sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitClauses(text, sourceName = "") {
  return cleanHeadline(text, sourceName)
    .split(/[,:;]|[·•]|\s+-\s+|…|\.\.\./)
    .map((part) => sanitize(part, 120))
    .filter(Boolean);
}

function normalizeSentence(text) {
  const cleaned = sanitize(text, 220);
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function stripSentenceEnding(text) {
  return sanitize(text, 220).replace(/[.!?]+$/u, "").trim();
}

function sentenceWithoutPeriod(text) {
  return normalizeSentence(text).replace(/[.!?]$/u, "");
}

function dedupeSentence(text) {
  return sanitize(
    text
      .replace(/\b([가-힣A-Za-z0-9]+)(\s+\1\b)+/gu, "$1")
      .replace(/\s+/g, " "),
    260
  );
}

function normalizeCompareText(text) {
  return sanitize(text, 260)
    .replace(/[“”"'‘’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoisySummary(text) {
  const cleaned = sanitize(text, 260);
  if (!cleaned) return true;
  if (/[?？!！]/u.test(cleaned)) return true;
  if (/[“”"'‘’]/u.test(cleaned)) return true;
  if (/충격|정체|뭐길래|껑충|독주|탈락|등장|밝혀진다|괴담|중독|잡아라/u.test(cleaned)) return true;
  if (/\d+(만명|억원|조|억|개)/u.test(cleaned) && cleaned.length < 40) return true;
  return false;
}

function isTooCloseToTitle(candidate, title) {
  const left = normalizeCompareText(candidate);
  const right = normalizeCompareText(title);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = new Set(left.split(/\s+/).filter((token) => token.length >= 2));
  const rightTokens = new Set(right.split(/\s+/).filter((token) => token.length >= 2));
  let overlap = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap >= Math.min(3, leftTokens.size);
}

function pickBestClause(parts, fallback = "") {
  for (const part of parts) {
    if (!part) continue;
    if (part.length < 6) continue;
    if (BLOCKED_SOURCE_NAMES.has(part)) continue;
    if (/^\d{4}년/.test(part)) continue;
    if (/^(광주뉴스|뉴스버스|네이트|뉴시스|연합뉴스)$/.test(part)) continue;
    return part;
  }
  return fallback;
}

function extractQuotedPhrase(text) {
  const match = text.match(/[“"'‘]([^”"'’]{4,20})[”"'’]/u);
  return sanitize(match?.[1] ?? "", 30);
}

function compressTitleWords(text) {
  const tokens = cleanHeadline(text)
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ""))
    .map((token) => token.replace(/(은|는|이|가|을|를|에|의|와|과|도|부터|까지|에서|으로|로)$/u, ""))
    .filter((token) => token && !STOPWORDS.has(token) && !GENERIC_TITLE_TOKENS.has(token));

  const combos = [
    tokens.slice(0, 2).join(" "),
    tokens.slice(0, 3).join(" "),
    tokens.slice(1, 3).join(" ")
  ];

  return combos.find((candidate) => candidate.length >= 7 && candidate.length <= 16) ?? "";
}

function titleFromKeywords(text, subInterest) {
  const patterns = KEYWORD_TITLE_MAP[subInterest] ?? [];
  for (const [keyword, replacement] of patterns) {
    if (text.includes(keyword)) {
      return replacement;
    }
  }
  return "";
}

function removeTrailingSource(text, sourceName = "") {
  const escaped = sourceName ? escapeRegExp(sourceName) : "";
  return sanitize(
    text
      .replace(escaped ? new RegExp(`${escaped}$`, "iu") : /$^/, " ")
      .replace(/\b([A-Za-z0-9.-]+\.(?:com|co\.kr|kr|net|org))$/iu, " ")
      .replace(/\s+/g, " "),
    240
  );
}

function buildFactSentence(sourceTitle, sourceSummary, sourceName) {
  const title = removeTrailingSource(cleanHeadline(sourceTitle, sourceName), sourceName);
  const summary = removeTrailingSource(cleanSummaryText(sourceSummary, sourceName), sourceName);
  const base = summary && summary !== title ? summary : title;

  if (/보험료 지원|혜택 늘릴/.test(title)) {
    return normalizeSentence("국민연금공단이 청년 첫 보험료 지원처럼 체감형 혜택을 넓히겠다는 방향을 밝혔다");
  }

  if (/국민연금공단/.test(title) && /이사장|청년/.test(title)) {
    return normalizeSentence("국민연금공단이 청년층이 체감할 수 있는 보험료 지원 확대 방향을 내놨다");
  }

  if (/묵돈\s*6억|6억/.test(title) && /국민연금|연금/.test(title)) {
    return normalizeSentence("연금 수급액 차이를 만드는 가입 기간과 소득 구간 기준을 짚었습니다");
  }

  if (/튀김/.test(title) && /이것/.test(title)) {
    return normalizeSentence("튀김을 조금 더 가볍게 먹는 방법과 조리 포인트를 짚었습니다");
  }

  if (/혈압/.test(title) && /중년/.test(title)) {
    return normalizeSentence("중년층이 봄철에 함께 점검해야 할 혈압과 관절 신호를 짚었습니다");
  }

  if (/환경정화/.test(title) && /롯데캐슬|롯데건설/.test(title)) {
    return normalizeSentence("롯데건설이 경기광주역 롯데캐슬 분양을 앞두고 현장 주변 환경정화에 나섰습니다");
  }

  if (/실적|영업익|반도체/.test(title)) {
    return normalizeSentence("반도체 수익이 전체 실적을 얼마나 끌어올렸는지에 초점이 맞춰졌습니다");
  }

  if (/공약|정책/.test(title) && /발표/.test(title)) {
    return normalizeSentence("무엇을 바꾸겠다는 것인지와 실제 실행 가능성을 함께 봐야 하는 발표입니다");
  }

  if (/뉴스초대석|오늘의 주요뉴스|한국뉴스\s*TV|뉴스\s*TV|브리핑/.test(title)) {
    return normalizeSentence("해당 이슈의 핵심 변화와 생활에 닿는 포인트를 짚었습니다");
  }

  const quoteMatch = title.match(/^(.+?)\s*[“"'‘](.+?)[”"'’]$/u);
  if (quoteMatch) {
    const subject = sanitize(quoteMatch[1], 80).replace(/[,，]$/u, "").trim();
    const message = sanitize(quoteMatch[2], 120).trim();
    if (subject && message) {
      return normalizeSentence(`${subject}가 ${message}고 밝혔습니다`);
    }
  }

  const commaMatch = title.match(/^(.+?)[,，]\s*(.+)$/u);
  if (commaMatch) {
    const subject = sanitize(commaMatch[1], 80).trim();
    const message = sanitize(commaMatch[2], 120).trim();
    if (subject && message) {
      return normalizeSentence(`${subject}가 ${message}`);
    }
  }

  if (summary && summary !== title) {
    return normalizeSentence(summary);
  }

  if (/[?？]/u.test(title) || /^\[/.test(sourceTitle)) {
    return normalizeSentence("제목보다 실제 변화와 생활 영향을 중심으로 봐야 합니다");
  }

  return normalizeSentence(base);
}

function buildPracticalSentence(item, sourceTitle, sourceSummary, sourceName) {
  const title = cleanHeadline(sourceTitle, sourceName);
  const summary = cleanSummaryText(sourceSummary, sourceName);
  const merged = `${title} ${summary}`;

  const map = {
    혈압: "혈압 변화는 운동 시간과 수면, 염분 섭취처럼 일상 습관을 같이 봐야 흐름이 보입니다",
    관절: "통증이 심해지는 동작과 시간대를 함께 살피면 병원에 갈 시점도 더 빨리 판단할 수 있습니다",
    음식: "무엇을 먹느냐보다 조리 방식과 양 조절을 어떻게 바꾸는지가 실제 실천 포인트입니다",
    상식: "증상만 외우기보다 언제 병원에 가야 하는지와 어떤 판단 기준이 필요한지가 중요합니다",
    병원: "진료 전 준비물과 예약, 본인 확인 절차를 알고 가면 병원 이용이 훨씬 수월해집니다",
    연금: "수급 나이와 가입 기간, 신청 서류처럼 숫자로 확인해야 하는 항목을 함께 챙겨야 합니다",
    세금: "신고 기한과 공제 항목, 증빙 서류를 한 번에 정리해야 실제 환급이나 절세로 이어집니다",
    보험: "보장 범위와 청구 조건, 예외 조항을 따로 봐야 실제 받을 수 있는 금액을 가늠할 수 있습니다",
    주의: "피해가 나는 방식과 의심해야 할 신호를 먼저 알아두면 불필요한 지출과 사기를 줄일 수 있습니다",
    혜택: "지원 대상과 신청 시기, 혜택 규모를 같이 봐야 놓치지 않고 바로 움직일 수 있습니다",
    꿀팁: "당장 오늘 적용할 수 있는 한 가지부터 고르면 생활 변화로 이어지기 쉽습니다",
    가전: "가격만 보지 말고 사용 빈도와 관리 편의성을 같이 따져야 후회가 적습니다",
    청소: "도구와 순서만 바꿔도 시간을 줄일 수 있어 작은 집안일 부담을 크게 덜 수 있습니다",
    요리: "재료 손질과 보관법을 함께 정리하면 식사 준비 시간이 눈에 띄게 줄어듭니다",
    교통: "바뀐 노선과 시간표를 미리 확인하면 이동 동선이 갑자기 꼬이는 일을 줄일 수 있습니다",
    "주요 뉴스": "오늘 벌어진 일 가운데 바로 생활 판단에 닿는 사실부터 챙기는 게 중요합니다",
    경제: "물가와 금리, 환율처럼 생활비에 직결되는 숫자를 같이 보면 기사 맥락이 더 잘 보입니다",
    정책: "발표와 시행 시점이 다를 수 있어 적용 대상과 시작 날짜를 함께 확인해야 합니다",
    사회: "지역 생활과 공공서비스 변화가 실제로 어디에 영향을 주는지 연결해서 읽는 게 중요합니다",
    해외: "국제 뉴스라도 유가와 환율, 수입 물가처럼 국내 생활비로 이어지는 지점을 함께 봐야 합니다",
    가족: "누가 지원을 받는지와 가정 안에서 실제로 달라지는 부분을 같이 보는 게 핵심입니다",
    부부: "역할 분담이나 대화 방식처럼 집 안에서 바로 부딪히는 장면에 어떻게 닿는지 보는 게 중요합니다",
    회사: "업무 방식과 조직 분위기, 평가 기준처럼 직장 생활에 직접 닿는 변화를 함께 봐야 합니다",
    취미: "시간과 비용을 얼마나 들여야 하는지까지 연결해야 실제로 이어갈지 판단할 수 있습니다",
    친구: "말투와 거리감, 반복되는 갈등 장면을 떠올리며 읽어야 실제 관계에 적용하기 쉽습니다"
  };

  if (/지원|혜택|신청/u.test(merged) && item.sub_interest !== "혜택") {
    return normalizeSentence("누가 대상인지와 언제 신청 가능한지를 먼저 확인해야 실제 도움으로 이어집니다");
  }
  if (/국민연금공단/.test(merged) && /청년/.test(merged)) {
    return normalizeSentence("내가 대상 연령인지와 보험료를 얼마나 덜 내게 되는지부터 보면 기사 핵심이 빨리 잡힙니다");
  }
  if (/분양|개발|정비|환경정화/u.test(merged)) {
    return normalizeSentence("지역 개발이나 정비 소식은 내 생활권과 교통, 주변 환경에 어떤 변화가 생기는지까지 같이 봐야 합니다");
  }
  if (/건강 루틴|습관|혈압/u.test(merged) && item.sub_interest === "혈압") {
    return normalizeSentence("아침 운동과 수면, 식습관처럼 하루 리듬 전체를 같이 조정해야 혈압 관리 효과를 보기 쉽습니다");
  }
  if (/보험료 지원|혜택 늘릴/u.test(merged)) {
    return normalizeSentence("지원이 실제로 늘어나는지 보려면 대상 연령과 가입 기간, 신청 절차가 어떻게 바뀌는지까지 같이 봐야 합니다");
  }
  if (/튀김|식품/u.test(merged) && item.sub_interest === "음식") {
    return normalizeSentence("같은 음식이라도 튀김옷과 기름 사용량, 곁들이는 재료를 바꾸면 건강 부담을 줄일 수 있습니다");
  }
  if (/어깨 통증|찌릿찌릿/u.test(merged) && item.sub_interest === "관절") {
    return normalizeSentence("통증이 생기는 자세와 시간대, 팔을 어디까지 올릴 수 있는지부터 살피면 판단이 쉬워집니다");
  }
  if (/롯데캐슬|분양/u.test(merged) && /환경정화/u.test(merged)) {
    return normalizeSentence("분양 홍보 기사로만 넘기지 말고 생활권 주변 정비와 교통, 환경 관리가 실제로 병행되는지 확인하는 편이 좋습니다");
  }

  return normalizeSentence(map[item.sub_interest] ?? "생활에 어떤 변화가 생기는지와 내가 바로 챙길 포인트가 무엇인지 함께 보는 게 중요합니다");
}

function buildExplanationSentence(item, sourceTitle, sourceSummary, sourceName) {
  const title = cleanHeadline(sourceTitle, sourceName);
  const summary = cleanSummaryText(sourceSummary, sourceName);
  const merged = `${title} ${summary}`;
  if (/보험료 지원|혜택 늘릴/u.test(merged)) {
    return normalizeSentence("지원 확대 방향만 볼 게 아니라 신청 대상과 금액, 시기를 같이 확인해야 실제 도움이 됩니다");
  }
  if (/환경정화/u.test(merged)) {
    return normalizeSentence("개발 홍보보다 주변 생활 환경이 실제로 어떻게 바뀌는지에 초점을 맞춰 봐야 합니다");
  }
  if (/고혈압|혈압/u.test(merged)) {
    return normalizeSentence("운동 하나보다 수면과 식사, 측정 시간까지 함께 맞추는 쪽이 실제 관리에 더 가깝습니다");
  }
  if (/보험료 지원|혜택 늘릴/u.test(merged)) {
    return normalizeSentence("이미 확정된 기준인지, 아직 방향만 나온 것인지부터 구분해서 봐야 합니다");
  }
  if (/튀김|식품/u.test(merged) && item.sub_interest === "음식") {
    return normalizeSentence("무엇을 먹느냐보다 조리 방식과 먹는 빈도를 어떻게 바꾸라는 뜻인지 살펴봐야 합니다");
  }
  if (/롯데캐슬|분양/u.test(merged) && /환경정화/u.test(merged)) {
    return normalizeSentence("입주민이나 인근 주민에게 어떤 변화가 생기는지까지 연결해서 봐야 의미가 있습니다");
  }

  return normalizeSentence(getCheckPointLine(item.sub_interest));
}

function compressFallbackTitle(title, subInterest) {
  const cleaned = cleanHeadline(title)
    .replace(/[,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = cleaned
    .split(" ")
    .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ""))
    .map((token) => token.replace(/(은|는|이|가|을|를|에|의|와|과|도|부터|까지|에서|으로|로)$/u, ""))
    .filter((token) => token && !STOPWORDS.has(token));

  const joined = tokens.slice(0, 3).join(" ");
  if (joined.length >= 7 && joined.length <= 16) {
    return joined;
  }

  const subFallback = `${subInterest} 핵심소식`;
  return subFallback.length <= 16 ? subFallback : subInterest;
}

function buildTitle(item, sourceTitle) {
  const cleaned = cleanHeadline(sourceTitle, item.source_name);
  if (item.sub_interest === "혜택" && /보험료 지원|혜택 늘릴/u.test(cleaned)) {
    return "청년 보험료 지원";
  }
  if (item.sub_interest === "혜택" && /국민연금공단|청년/u.test(cleaned)) {
    return "청년 지원 확대";
  }
  if (item.sub_interest === "혈압" && /아침 10.?분|건강 루틴 5가지/u.test(cleaned)) {
    return "혈압 관리 루틴";
  }
  if (item.sub_interest === "혈압" && /중년|치매 위험/u.test(cleaned)) {
    return "중년 혈압 경고";
  }
  if (item.sub_interest === "혈압" && /중년에 혈압 관리/u.test(cleaned)) {
    return "중년 혈압 관리";
  }
  if (item.sub_interest === "관절" && /어깨 통증|찌릿찌릿/u.test(cleaned)) {
    return "어깨 통증 신호";
  }
  if (item.sub_interest === "관절" && /아픈 어깨|간암 증상|검사해보면 정상/u.test(cleaned)) {
    return "어깨 통증 점검";
  }
  if (item.sub_interest === "연금" && /묵돈\s*6억|6억/.test(cleaned)) {
    return "국민연금 수급";
  }
  if (item.sub_interest === "음식" && /4조 시장|건강관리 식품/u.test(cleaned)) {
    return "건강식품 경쟁";
  }
  if (item.sub_interest === "음식" && /심장을|살 빼려 먹은/u.test(cleaned)) {
    return "식단 위험 신호";
  }
  if (item.sub_interest === "상식" && /봄철 자외선 증가/u.test(cleaned)) {
    return "봄철 자외선 주의";
  }
  if (item.sub_interest === "사회" && /환경정화/u.test(cleaned)) {
    return "분양 앞 환경정화";
  }
  const keywordTitle = titleFromKeywords(cleaned, item.sub_interest);
  if (keywordTitle) {
    return keywordTitle;
  }
  const quoted = extractQuotedPhrase(cleaned);
  if (quoted && quoted.length >= 7 && quoted.length <= 18 && !GENERIC_TITLE_TOKENS.has(quoted)) {
    return quoted;
  }

  const clauses = splitClauses(cleaned, item.source_name);
  const candidate =
    pickBestClause(
      clauses.filter(
        (part) =>
          !/[?？!]/.test(part) &&
          !/오늘의|한눈에 보는|이것|무조건|잡아라|뭐길래|이거/.test(part) &&
          !/^\d+\s*(주|조|개|분|원)\b/u.test(part)
      ),
      clauses[0] ?? ""
    ) || cleaned;

  if (candidate.length >= 7 && candidate.length <= 18 && !/^\d+\s*(주|조|개|분|원)\b/u.test(candidate)) {
    return candidate;
  }

  const shortened = compressTitleWords(candidate);

  if (shortened.length >= 7 && shortened.length <= 18 && !/^\d+\s*(주|조|개|분|원)\b/u.test(shortened)) {
    return shortened;
  }

  return compressFallbackTitle(candidate || sourceTitle, item.sub_interest);
}

function getDisplayCategory(category) {
  return category === "취미" ? "실생활" : category === "가족" ? "관계" : category;
}

function getSubInterestContext(subInterest) {
  const map = {
    가족: "가족 안에서 누가 도움을 받을 수 있는지와 실제 지원 방식이 중요합니다.",
    부부: "부부 사이에서 바로 바꿀 수 있는 대화 방식이나 역할 조정이 핵심입니다.",
    회사: "직장 안 소통 방식과 일 처리 순서를 바꿀 여지가 있는지 보는 게 중요합니다.",
    취미: "시간과 비용 부담을 줄이면서 이어갈 수 있는지가 포인트입니다.",
    친구: "관계의 거리감과 말투를 어떻게 조정할지가 실제 포인트입니다.",
    연금: "수급 시기와 대상, 준비 서류를 구체적으로 챙겨보는 게 중요합니다.",
    세금: "신고 기한과 공제 기준, 필요한 서류를 같이 보는 게 핵심입니다.",
    보험: "보장 범위와 실제 청구 가능성을 나눠 보는 게 중요합니다.",
    주의: "피해를 막기 위해 어디서 의심해야 하는지 먼저 아는 것이 중요합니다.",
    혜택: "내가 대상인지, 언제 신청해야 하는지가 가장 먼저 확인할 부분입니다.",
    혈압: "혈압 수치만이 아니라 생활 시간표와 습관까지 같이 보는 게 중요합니다.",
    관절: "어떤 동작과 시간대에 통증이 심해지는지 확인하는 게 핵심입니다.",
    음식: "무엇을 먹느냐보다 어떤 방식으로 바꿀지가 실제 포인트입니다.",
    상식: "막연한 상식보다 실제 판단 기준을 분명히 아는 게 중요합니다.",
    병원: "방문 전 준비와 본인 확인, 진료 후 절차를 챙기는 게 핵심입니다.",
    꿀팁: "오늘 바로 적용할 수 있는 작은 변화가 있는지가 포인트입니다.",
    가전: "가격보다 사용 빈도와 관리 편의성을 함께 따지는 게 중요합니다.",
    청소: "청소 순서와 도구를 바꾸면 체감 효율이 커질 수 있습니다.",
    요리: "재료 손질과 준비 시간을 줄이는 방법이 실제 포인트입니다.",
    교통: "바뀐 시간과 동선이 내 이동에 어떤 차이를 만드는지 보는 게 중요합니다.",
    "주요 뉴스": "오늘 꼭 먼저 챙겨야 할 사실과 일정이 무엇인지가 핵심입니다.",
    경제: "숫자 변화가 생활비와 투자 판단에 어떤 영향을 주는지가 중요합니다.",
    정책: "발표 내용이 실제 신청 조건과 시행 시점으로 어떻게 이어지는지가 포인트입니다.",
    사회: "지역 생활과 공공 서비스에 실제로 어떤 변화가 생기는지가 중요합니다.",
    해외: "국외 이슈가 국내 비용과 소비 판단에 어떻게 이어지는지가 핵심입니다."
  };
  return map[subInterest] ?? "생활에 바로 닿는 변화가 무엇인지 확인하는 게 중요합니다.";
}

function getActionLine(subInterest) {
  const map = {
    가족: "가족 안에서 달라질 부분이 있는지 먼저 떠올려보세요.",
    부부: "부부 사이에서 바로 바꿀 수 있는 한 가지만 챙겨보세요.",
    회사: "회사에서 바로 겪을 수 있는 상황인지 먼저 연결해보세요.",
    취미: "내 여가 시간과 소비 습관에 닿는 부분만 기억해두세요.",
    친구: "내 인간관계에 비슷한 장면이 있는지만 떠올려보세요.",
    연금: "내 수급 시기와 조건에 닿는지부터 체크해두세요.",
    세금: "신고 일정이나 대상에 내가 포함되는지 먼저 보세요.",
    보험: "내가 이미 가입한 보험과 뭐가 다른지 떠올려보세요.",
    주의: "오늘 바로 조심해야 할 한 가지 포인트만 기억해두세요.",
    혜택: "신청 대상과 금액, 기간부터 먼저 체크해두세요.",
    혈압: "매일 관리 습관 중 하나만 바로 떠올려보세요.",
    관절: "통증이 심해지는 생활 습관이 있는지 먼저 점검해보세요.",
    음식: "오늘 식단에서 바꿀 수 있는 한 가지를 떠올려보세요.",
    상식: "헷갈렸던 건강 상식 하나를 바로잡는다는 느낌으로 읽어보세요.",
    병원: "병원 가기 전 챙길 준비만 먼저 기억해두세요.",
    꿀팁: "오늘 바로 써먹을 수 있는 포인트만 챙기면 됩니다.",
    가전: "집에 있는 기기 중 바로 적용할 부분만 떠올려보세요.",
    청소: "청소 순서 하나만 바꿔도 되는지 생각해보세요.",
    요리: "오늘 식탁에 바로 적용할 수 있는 팁만 기억해두세요.",
    교통: "내 이동 시간에 영향이 있는지만 먼저 확인해두세요.",
    "주요 뉴스": "오늘 꼭 알아둘 흐름 하나만 먼저 기억해두세요.",
    경제: "내 소비나 체감 물가와 닿는 부분만 먼저 보세요.",
    정책: "생활에 직접 바뀔 규칙이 있는지 먼저 체크해보세요.",
    사회: "내 지역이나 생활권과 맞닿는지만 먼저 확인해보세요.",
    해외: "국내에도 번질 수 있는 흐름인지 한 번만 짚어보세요."
  };
  return map[subInterest] ?? "핵심만 빠르게 챙겨보세요.";
}

function getAudienceLine(subInterest) {
  const map = {
    혈압: "평소 혈압이 들쑥날쑥하거나 가족력이 있는 사람에게 특히 참고가 됩니다.",
    관절: "어깨나 무릎처럼 반복 통증이 있는 사람일수록 더 유심히 볼 만합니다.",
    음식: "먹는 습관을 바꾸고 싶은 사람이나 건강식을 고르는 사람에게 도움이 됩니다.",
    상식: "평소 헷갈리던 건강 상식을 정리하고 싶은 사람에게 맞는 내용입니다.",
    병원: "진료를 앞두고 있거나 병원 절차를 자주 겪는 사람에게 바로 닿는 정보입니다.",
    연금: "노후 준비를 시작했거나 수급 시기를 계산해야 하는 사람에게 중요합니다.",
    세금: "신고를 앞둔 사람이나 서류 준비가 필요한 사람에게 직접적인 정보입니다.",
    보험: "기존 보험을 유지할지 새로 가입할지 판단하는 사람에게 참고가 됩니다.",
    주의: "피해를 피해야 하는 소비자나 금융 이용자에게 경고성 정보로 읽힙니다.",
    혜택: "지원 대상인지 애매했던 사람에게 신청 가능성을 가늠하는 기준이 됩니다.",
    꿀팁: "당장 오늘 생활 속에서 작은 변화를 만들고 싶은 사람에게 잘 맞습니다.",
    가전: "집에서 쓰는 기기를 바꾸거나 새로 들일지 고민하는 사람에게 도움이 됩니다.",
    청소: "집안 정리나 청소 동선을 줄이고 싶은 사람에게 실용적인 내용입니다.",
    요리: "재료 준비나 조리 시간을 줄이고 싶은 사람에게 바로 연결됩니다.",
    교통: "출퇴근이나 외출 동선이 자주 바뀌는 사람에게 체감도가 높은 정보입니다.",
    "주요 뉴스": "오늘 전체 흐름을 빠르게 따라가야 하는 사람에게 우선순위가 높은 정보입니다.",
    경제: "생활비와 투자, 소비 흐름을 같이 보는 사람에게 직접적인 판단 재료가 됩니다.",
    정책: "제도 변화가 실제 신청이나 이용 조건에 미치는 영향을 보는 데 유용합니다.",
    사회: "지역 생활이나 공공 서비스 변화에 민감한 사람에게 의미가 큽니다.",
    해외: "환율이나 국제 이슈가 국내 생활비에 어떻게 이어지는지 보는 데 도움이 됩니다.",
    가족: "집 안 돌봄이나 자녀 문제를 함께 고민하는 보호자에게 잘 맞습니다.",
    부부: "가사와 역할, 대화 방식처럼 생활 갈등을 줄이고 싶은 부부에게 의미가 있습니다.",
    회사: "직장 안 분위기나 소통 문제를 겪는 사람에게 현실적인 시사점을 줍니다.",
    취미: "시간과 비용을 적게 들이면서도 즐길 거리를 찾는 사람에게 맞는 내용입니다.",
    친구: "거리 두기와 관계 유지 사이에서 균형을 고민하는 사람에게 참고가 됩니다."
  };
  return map[subInterest] ?? "생활에 바로 연결해볼 수 있는 사람에게 특히 도움이 되는 정보입니다.";
}

function getCheckPointLine(subInterest) {
  const map = {
    혈압: "체크해야 할 건 시간대와 생활 습관, 그리고 병원 검진이 필요한 신호입니다.",
    관절: "통증이 반복되는 동작과 통원 여부, 무리한 운동을 줄일 기준을 함께 봐야 합니다.",
    음식: "무엇을 먹느냐보다 얼마나 자주, 어떤 방식으로 바꾸느냐가 핵심입니다.",
    상식: "막연한 상식 대신 실제 판단 기준이 무엇인지 분리해서 보는 게 중요합니다.",
    병원: "준비 서류와 본인 확인, 진료 전후 절차를 먼저 챙기면 실수가 줄어듭니다.",
    연금: "수급 시기와 가입 기간, 준비 서류처럼 숫자로 확인할 항목이 중요합니다.",
    세금: "기한과 대상, 공제 여부처럼 바로 계산에 들어가는 기준을 먼저 확인해야 합니다.",
    보험: "보장 범위와 예외 조건, 실제 청구 가능성을 분리해서 보는 편이 좋습니다.",
    주의: "피해가 생기는 경로와 바로 차단할 수 있는 행동을 같이 기억해두는 게 좋습니다.",
    혜택: "대상과 금액, 신청 시기와 증빙 서류를 함께 봐야 실질적인 도움으로 이어집니다.",
    꿀팁: "준비 시간과 비용이 적게 드는지부터 따져보면 바로 적용하기 쉽습니다.",
    가전: "가격보다 사용 빈도와 관리 편의성을 같이 보면 선택이 쉬워집니다.",
    청소: "순서와 도구, 자주 손대는 구역을 함께 정리하면 체감 효율이 커집니다.",
    요리: "재료 손질과 보관 방식, 조리 시간을 줄이는 포인트를 같이 보는 게 좋습니다.",
    교통: "변경 시점과 우회 동선, 대체 수단을 같이 확인해야 불편을 줄일 수 있습니다.",
    "주요 뉴스": "결정된 사실과 예고 단계 정보를 구분해서 보는 것이 우선입니다.",
    경제: "수치 변화가 생활비와 투자 판단에 어떤 차이를 만드는지까지 연결해봐야 합니다.",
    정책: "발표와 시행은 다를 수 있으니 적용 시점과 대상부터 분명히 확인해야 합니다.",
    사회: "지역별 차이와 실제 이용 경로를 같이 봐야 체감 변화가 선명해집니다.",
    해외: "국외 이슈라도 환율과 원자재, 수입 물가처럼 국내 연결고리를 보는 게 핵심입니다.",
    가족: "누가 대상인지와 어떤 지원을 실제로 받을 수 있는지를 먼저 구체적으로 봐야 합니다.",
    부부: "가사 분담이나 대화 방식처럼 생활 속에서 바로 바꿀 지점을 찾는 게 중요합니다.",
    회사: "규정과 관계, 실제 업무 분배에 어떤 변화가 생기는지로 읽는 편이 좋습니다.",
    취미: "부담 없이 오래 이어갈 수 있는지와 비용 대비 만족도를 함께 봐야 합니다.",
    친구: "말투와 거리감, 반복되는 갈등 장면을 어디서 끊을지 떠올리며 읽는 게 좋습니다."
  };
  return map[subInterest] ?? "대상과 시기, 생활에 미치는 영향을 같이 보는 편이 좋습니다.";
}

function buildLeadSentence(sourceTitle) {
  const cleaned = cleanHeadline(sourceTitle);
  return normalizeSentence(cleaned);
}

function pickDetailClause(sourceTitle, sourceSummary, sourceName) {
  const cleanedTitle = cleanHeadline(sourceTitle, sourceName);
  const cleanedSummary = cleanSummaryText(sourceSummary, sourceName);
  const normalizedTitle = normalizeCompareText(cleanedTitle);
  const titleClauses = splitClauses(cleanedTitle, sourceName);
  const summaryClauses = splitClauses(cleanedSummary, sourceName);

  const candidates = [...summaryClauses, ...titleClauses.slice(1)]
    .map((part) => sanitize(part, 120))
    .filter(Boolean)
    .filter((part) => {
      const normalizedPart = normalizeCompareText(part);
      return normalizedPart && normalizedPart !== normalizedTitle && !normalizedTitle.includes(normalizedPart);
    })
    .filter((part) => !/출처|카테고리|세부카테고리|기고|기자/.test(part));

  return pickBestClause(candidates, "");
}

function collectDetailClauses(sourceTitle, sourceSummary, sourceName) {
  const cleanedTitle = cleanHeadline(sourceTitle, sourceName);
  const cleanedSummary = cleanSummaryText(sourceSummary, sourceName);
  const titleClauses = splitClauses(cleanedTitle, sourceName);
  const summaryClauses = splitClauses(cleanedSummary, sourceName);
  const seen = new Set();

  return [...summaryClauses, ...titleClauses]
    .map((part) => sanitize(part, 140))
    .filter(Boolean)
    .filter((part) => !/출처|카테고리|세부카테고리|기고|기자|뉴스|기사/.test(part))
    .filter((part) => !isNoisySummary(part))
    .filter((part) => part.length >= 8)
    .filter((part) => {
      const normalized = normalizeCompareText(part);
      if (!normalized || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    })
    .slice(0, 4);
}

function joinSentences(parts, limit = 9999) {
  return sanitize(
    parts
      .map((part) => sanitize(part, 520))
      .filter(Boolean)
      .join(" "),
    limit
  );
}

function hasListStyleTitle(sourceTitle, sourceSummary) {
  const merged = `${sourceTitle} ${sourceSummary}`;
  return /(\d+가지|\d+개|\d+가지\s*루틴|루틴\s*\d+가지)/u.test(merged);
}

function buildListAwareDetails(item, detailClauses, sourceTitle, sourceSummary) {
  const merged = `${cleanHeadline(sourceTitle, item.source_name)} ${cleanSummaryText(sourceSummary, item.source_name)}`;

  if (item.sub_interest === "혈압" && hasListStyleTitle(sourceTitle, sourceSummary)) {
    return [
      "기사에서 먼저 강조한 것은 기상 직후 스마트폰을 바로 보지 않는 습관입니다. 잠에서 깨자마자 뉴스나 메시지를 확인하면 긴장 반응이 커져 심박수와 혈압이 함께 올라갈 수 있어, 몇 분이라도 화면보다 몸 상태를 먼저 살피는 편이 좋다고 짚습니다.",
      "함께 제시된 방법은 호흡 속도를 천천히 낮추는 것입니다. 특히 들이마시는 시간보다 내쉬는 시간을 더 길게 잡으면 몸을 안정시키는 부교감신경이 활성화돼 혈압이 급하게 오르는 흐름을 누그러뜨리는 데 도움이 될 수 있다고 설명합니다.",
      "아침에 물 한 잔을 마시는 습관도 중요하게 다뤘습니다. 자는 동안 수분이 빠지면 혈액이 더 끈적해지고 심장 부담이 커질 수 있는데, 기상 직후 수분을 보충하면 혈액 흐름을 조금 더 부드럽게 만들어 혈압 상승을 완화하는 데 도움이 된다고 봤습니다.",
      "식사에서는 소금을 줄이는 것과 함께 칼륨이 풍부한 음식을 챙기는 점이 강조됐습니다. 바나나, 아보카도, 시금치, 콩류처럼 나트륨 배출을 돕는 식품을 아침 식단에 함께 넣으면 하루 전체 혈압 관리에 더 유리하다는 설명입니다.",
      "마지막으로 아침 햇살을 짧게라도 쬐는 습관이 소개됐습니다. 햇빛이 생체 리듬을 조절하고 자율신경 균형을 맞추는 데 도움을 줄 수 있어, 기상 직후 몸을 깨우는 생활 신호로 활용하라는 내용입니다."
    ];
  }

  if (item.sub_interest === "부부") {
    return [
      "갈등의 시작점은 거창한 사건보다 생활 속 반복 장면에 가까운 경우가 많습니다. 설거지, 장보기, 연락처럼 사소해 보이는 일에서 기대가 어긋나면 서운함이 오래 남는다고 짚습니다.",
      "그래서 중요한 것은 감정이 커진 뒤 한꺼번에 말하는 방식보다, 반복해서 부딪히는 장면을 먼저 정확히 찾는 일입니다. 언제 말투가 날카로워지는지, 어떤 부탁에서 늘 오해가 생기는지 알아야 대화가 감정싸움으로만 흐르지 않습니다.",
      "역할 분담도 같은 맥락에서 봐야 합니다. 누가 더 많이 하느냐만 따지면 쉽게 방어적으로 반응하게 되지만, 지금 집안일과 돌봄, 일정 조율 중에서 무엇이 가장 자주 비는지부터 확인하면 대화가 훨씬 구체적으로 바뀝니다.",
      "표현의 타이밍도 갈등 크기를 바꾸는 요소로 다뤄집니다. 서운함이 커진 뒤 몰아서 말하면 상대는 비난처럼 받아들이기 쉽고, 필요한 일을 미리 짧게 말하면 갈등이 커지기 전에 조정할 여지가 생깁니다."
    ];
  }

  if (item.sub_interest === "보험") {
    return [
      "보험 기사는 상품 이름보다 실제로 어디까지 보장되는지부터 따져봐야 한다는 점을 강조합니다. 병원비, 입원비, 수술비처럼 어떤 상황에서 얼마까지 보장되는지 알아야 도움이 되는 보험인지 판단할 수 있습니다.",
      "같은 질환이라도 기존 병력이나 치료 방식에 따라 보험금 지급이 제한될 수 있다는 점도 함께 짚습니다. 약관에서 제외되는 조건을 먼저 보면 나중에 실망할 일을 줄일 수 있습니다.",
      "청구 절차와 필요한 서류도 중요한 판단 기준으로 다룹니다. 서류가 복잡하거나 청구 가능 기간이 짧으면 정작 필요할 때 보장을 놓치기 쉬워, 진단서와 영수증처럼 필요한 자료를 미리 확인해두는 편이 안전합니다."
    ];
  }

  if (item.sub_interest === "혜택") {
    return [
      "지원 기사에서는 제도 이름보다 내가 대상에 들어가는지가 먼저입니다. 연령, 소득, 가입 기간처럼 바로 걸리는 조건부터 확인해야 실제 신청 가능성을 판단할 수 있습니다.",
      "같은 지원이라도 금액과 적용 기간, 신청 시기가 다를 수 있어 방향 발표인지 즉시 적용인지 구분해서 봐야 합니다. 혜택 규모만 보고 지나치면 실제로는 아직 준비 단계인 경우도 적지 않습니다.",
      "결국 중요한 것은 지원이 존재한다는 사실보다 내 상황에 연결되는 기준이 무엇인지 파악하는 일입니다. 준비 서류와 신청 시기를 같이 정리해두면 놓치는 일이 줄어듭니다."
    ];
  }

  const mapped = detailClauses.map((detail, index) => {
    if (index === 0) {
      return `${stripSentenceEnding(detail)} 부분이 먼저 눈에 들어옵니다. 제목만 보는 것보다 실제로 무엇이 달라지는지 연결해서 봐야 핵심이 잡힙니다.`;
    }
    if (index === 1) {
      return `${stripSentenceEnding(detail)} 지점도 같이 살펴볼 필요가 있습니다. 기사 핵심은 단순 사실 전달보다 생활에서 바로 확인해야 할 변화에 가깝습니다.`;
    }
    return `${stripSentenceEnding(detail)} 대목까지 이어서 보면 이번 변화가 누구에게, 어떤 방식으로 닿는지 더 분명해집니다.`;
  });

  if (mapped.length > 0) {
    return mapped;
  }

  const mergedLower = merged.toLowerCase();
  if (/정책|공약|발표/u.test(merged)) {
    return [
      "정책 발표 기사는 문구보다 실제 적용 시점을 먼저 확인해야 합니다. 발표 시점과 시행 시점이 다르면 체감 시기도 달라질 수 있습니다.",
      "또 누가 대상에 들어가는지, 신청이나 이용 조건이 어떻게 바뀌는지를 같이 봐야 생활 변화로 이어지는지 판단할 수 있습니다."
    ];
  }
  if (/경제|금리|환율|물가/u.test(merged)) {
    return [
      "경제 기사는 숫자 하나보다 생활비와 소비 판단에 어떤 차이를 만드는지까지 같이 봐야 의미가 생깁니다.",
      "특히 환율과 물가처럼 체감비용에 바로 닿는 항목은 단기 변화보다 당장 생활에서 무엇을 조심해야 하는지로 읽는 편이 더 현실적입니다."
    ];
  }
  if (/가족|돌봄|양육/u.test(mergedLower)) {
    return [
      "가족 관련 기사는 지원 여부보다 집 안에서 실제로 무엇이 달라지는지를 같이 봐야 합니다.",
      "누가 대상에 들어가고, 돌봄이나 양육 부담을 얼마나 덜 수 있는지가 핵심 포인트가 됩니다."
    ];
  }

  return [
    `${stripSentenceEnding(buildPracticalSentence(item, sourceTitle, sourceSummary, item.source_name))}.`,
    `${stripSentenceEnding(buildExplanationSentence(item, sourceTitle, sourceSummary, item.source_name))}.`
  ];
}

function buildShortSummary(item, sourceTitle, sourceSummary) {
  const title = cleanHeadline(sourceTitle, item.source_name);
  const cleanedSummary = cleanSummaryText(sourceSummary, item.source_name);
  const fact = stripSentenceEnding(buildFactSentence(sourceTitle, sourceSummary, item.source_name));
  const practical = stripSentenceEnding(buildPracticalSentence(item, sourceTitle, sourceSummary, item.source_name));
  const detailClauses = collectDetailClauses(sourceTitle, sourceSummary, item.source_name);

  const opening =
    cleanedSummary && !isNoisySummary(cleanedSummary) && !isTooCloseToTitle(cleanedSummary, title)
      ? normalizeSentence(cleanedSummary)
      : !isTooCloseToTitle(fact, title)
        ? normalizeSentence(fact)
        : "";

  const detail =
    detailClauses[0] && !isTooCloseToTitle(detailClauses[0], title)
      ? normalizeSentence(detailClauses[0])
      : normalizeSentence(practical);

  const lines = [opening, detail]
    .filter(Boolean)
    .filter((line, index, arr) => arr.findIndex((other) => normalizeCompareText(other) === normalizeCompareText(line)) === index)
    .slice(0, 2);

  return sanitize(lines.join(" "), 360);
}

function buildLongSummary(item, sourceTitle, sourceSummary) {
  const title = cleanHeadline(sourceTitle, item.source_name);
  const cleanedSummary = cleanSummaryText(sourceSummary, item.source_name);
  const detailClauses = collectDetailClauses(sourceTitle, sourceSummary, item.source_name);
  const fact = stripSentenceEnding(buildFactSentence(sourceTitle, sourceSummary, item.source_name));
  const opening =
    cleanedSummary && !isNoisySummary(cleanedSummary) && !isTooCloseToTitle(cleanedSummary, title)
      ? normalizeSentence(cleanedSummary)
      : !isTooCloseToTitle(fact, title)
        ? normalizeSentence(fact)
        : "";

  let detailParagraphs = buildListAwareDetails(item, detailClauses, sourceTitle, sourceSummary);

  if (detailParagraphs.length === 0 && detailClauses.length > 0) {
    detailParagraphs = detailClauses.map((detail, index) => {
      const cleaned = stripSentenceEnding(detail);
      if (index === 0) {
        return `${cleaned} 내용이 핵심으로 제시됐습니다.`;
      }
      if (index === 1) {
        return `${cleaned} 부분도 함께 확인해야 기사 흐름이 이어집니다.`;
      }
      return `${cleaned} 대목도 같이 언급됐습니다.`;
    });
  }

  const paragraphs = [opening, ...detailParagraphs]
    .map((line) =>
      sanitize(line, 700)
        .replace(/기사입니다|기사다|내용입니다|내용이다|흐름입니다|흐름이다/gu, "")
        .replace(/확인하는 편이 좋습니다/gu, "확인해야 합니다")
        .replace(/읽는 편이 좋습니다/gu, "봐야 합니다")
        .replace(/실제 생활에 어떻게 닿는지/gu, "생활에 어떤 영향을 주는지")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .filter((line, index, arr) => arr.findIndex((other) => normalizeCompareText(other) === normalizeCompareText(line)) === index);

  if (paragraphs.length < 3) {
    const practical = normalizeSentence(buildPracticalSentence(item, sourceTitle, sourceSummary, item.source_name));
    paragraphs.push(practical);
  }

  return sanitize(paragraphs.join(" "), 5200);
}

function buildActionLine(item) {
  return getActionLine(item.sub_interest);
}

async function main() {
  const { data, error } = await supabase
    .from("content_items")
    .select("id, title, short_summary, long_summary, action_line, category, sub_interest, source_name, raw_text")
    .eq("approval_status", "approved");

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const updates = rows.map((item) => {
    const sourceTitle = extractField(item.raw_text ?? "", "원문 제목") || item.title;
    const sourceSummary = extractField(item.raw_text ?? "", "원문 요약");

    return {
      id: item.id,
      title: buildTitle(item, sourceTitle),
      short_summary: buildShortSummary(item, sourceTitle, sourceSummary),
      long_summary: buildLongSummary(item, sourceTitle, sourceSummary),
      action_line: buildActionLine(item)
    };
  });

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from("content_items")
      .update({
        title: update.title,
        short_summary: update.short_summary,
        long_summary: update.long_summary,
        action_line: update.action_line,
        updated_at: new Date().toISOString()
      })
      .eq("id", update.id);

    if (updateError) {
      throw updateError;
    }
  }

  console.log(
    JSON.stringify(
      {
        updated: updates.length,
        sample: updates.slice(0, 10)
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
