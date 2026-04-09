import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

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

const approved = env.ALLOW_PRODUCTION_CONTENT_SEED?.trim().toLowerCase();
if (!["1", "true", "yes", "on"].includes(approved || "")) {
  throw new Error("ALLOW_PRODUCTION_CONTENT_SEED=true 설정 후 다시 실행하세요.");
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
function getKstDateString(date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function addDays(dateString, days) {
  const base = new Date(`${dateString}T00:00:00+09:00`);
  base.setUTCDate(base.getUTCDate() + days);
  return getKstDateString(base);
}

const TODAY_KST = process.env.CONTENT_SEED_DATE?.trim() || getKstDateString(new Date());
const START_KST = addDays(TODAY_KST, -6);

const STORED_CATEGORY_BY_MAIN_INTEREST = {
  건강: "건강",
  돈: "돈",
  실생활: "취미",
  뉴스: "뉴스",
  관계: "가족"
};

const TAXONOMY = {
  건강: {
    혈압: ["혈압 관리", "고혈압", "혈압 측정"],
    관절: ["관절 통증", "무릎 건강", "관절염"],
    음식: ["건강 음식", "식단 관리", "음식 건강"],
    상식: ["건강 상식", "생활 건강", "의학 상식"],
    병원: ["병원 이용", "진료 안내", "병원 진료"]
  },
  돈: {
    연금: ["연금 수령", "국민연금", "퇴직연금"],
    세금: ["세금 신고", "홈택스", "절세"],
    보험: ["보험", "건강보험", "실손보험"],
    주의: ["금융사기 주의", "소비자 주의", "보이스피싱"],
    혜택: ["지원 혜택", "복지 혜택", "정부 혜택"]
  },
  실생활: {
    꿀팁: ["생활 꿀팁", "생활 정보", "정리 팁"],
    가전: ["가전 관리", "가전 청소", "전자제품 관리"],
    청소: ["청소 팁", "집 청소", "정리정돈"],
    요리: ["간단 요리", "집밥 레시피", "요리 팁"],
    교통: ["교통 정보", "대중교통", "교통 정책"]
  },
  뉴스: {
    "주요 뉴스": ["주요 뉴스", "오늘 뉴스", "속보"],
    경제: ["경제 뉴스", "환율 물가", "금리 경제"],
    정책: ["정책 발표", "제도 변경", "정책 변화"],
    사회: ["사회 뉴스", "생활 사회", "안전 교육"],
    해외: ["해외 뉴스", "국제 뉴스", "글로벌 경제"]
  },
  관계: {
    가족: ["가족 관계", "돌봄 가족", "양육 가족"],
    부부: ["부부 관계", "가사 분담", "부부 대화"],
    회사: ["직장 소통", "회사 관계", "직장인 업무"],
    취미: ["취미 생활", "문화 생활", "여가 활동"],
    친구: ["친구 관계", "대인관계", "인간관계"]
  }
};

const BLOCKED_SOURCE_NAMES = new Set([
  "네이트",
  "다음",
  "네이버",
  "뉴스버스",
  "newsis.com",
  "브런치",
  "영남경제",
  "withnews",
  "car.withnews.kr",
  "x.com",
  "뉴스통",
  "twig24.com",
  "네이트뷰",
  "더코리아",
  "에이빙",
  "https://www.russia-asean.com/",
  "e-patentnews.com",
  "e-빠른뉴스",
  "sisa-news.com",
  "cj-ilbo.com",
  "K-Life TV",
  "frame-less.co.kr",
  "데일리대구경북뉴스",
  "주간시사매거진",
  "경기북부탑뉴스",
  "서울와이어",
  "브랜드경제신문",
  "디멘시아뉴스",
  "뉴스클립",
  "뉴스초대석"
]);

const MATCH_KEYWORDS = {
  건강: {
    혈압: ["혈압", "고혈압", "저혈압", "혈관"],
    관절: ["관절", "무릎", "어깨", "허리", "척추", "손목", "연골", "오십견"],
    음식: ["음식", "식품", "식단", "요리", "먹", "영양", "튀김", "반찬", "레시피"],
    상식: ["건강", "검사", "치과", "치아", "약", "의사", "임플란트", "증상"],
    병원: ["병원", "진료", "의료", "응급", "예약", "신분증", "환자"]
  },
  돈: {
    연금: ["연금", "국민연금", "기초연금", "퇴직연금", "수급"],
    세금: ["세금", "종소세", "부가세", "소득세", "신고", "공제", "홈택스"],
    보험: ["보험", "실손", "실비", "보장", "생명보험", "건강보험"],
    주의: ["사기", "피싱", "주의", "피해", "사칭", "불법", "경고"],
    혜택: ["지원", "혜택", "복지", "할인", "쿠폰", "바우처", "신청"]
  },
  실생활: {
    꿀팁: ["팁", "꿀팁", "정리", "생활", "요령"],
    가전: ["가전", "전자제품", "냉장고", "세탁기", "청소기", "에어컨"],
    청소: ["청소", "정리", "수납", "세탁"],
    요리: ["요리", "레시피", "집밥", "조리", "반찬"],
    교통: ["교통", "버스", "지하철", "철도", "도로", "운행", "우회"]
  },
  뉴스: {
    "주요 뉴스": ["현안", "속보", "발표", "회의", "점검", "주요", "오늘"],
    경제: ["경제", "실적", "물가", "금리", "환율", "증시", "반도체", "투자", "주가"],
    정책: ["정책", "공약", "제도", "시행", "개편", "지원", "발표"],
    사회: ["사회", "청소년", "교육", "안전", "복지", "지역", "환경", "사건", "사고"],
    해외: ["해외", "국제", "미국", "중국", "일본", "유럽", "글로벌", "세계", "유가", "환율"]
  },
  관계: {
    가족: ["가족", "양육", "보호자", "부모", "자녀", "돌봄"],
    부부: ["부부", "이혼", "배우자", "가사", "혼인"],
    회사: ["직장", "회사", "근무", "업무", "노조", "월급"],
    취미: ["취미", "문화", "여가", "독서", "여행", "사진", "전시"],
    친구: ["친구", "대인관계", "인간관계", "우정"]
  }
};

const TITLE_FALLBACKS = {
  혈압: "혈압 관리 변화",
  관절: "관절 건강 정보",
  음식: "식단 관리 요령",
  상식: "건강 상식 점검",
  병원: "병원 이용 안내",
  연금: "연금 수급 기준",
  세금: "세금 신고 기준",
  보험: "보험 보장 점검",
  주의: "금융 주의 정보",
  혜택: "지원 혜택 정리",
  꿀팁: "생활 팁 정리",
  가전: "가전 관리 요령",
  청소: "청소 정리 요령",
  요리: "간단 요리 팁",
  교통: "교통 정보 확인",
  "주요 뉴스": "오늘 주요 뉴스",
  경제: "경제 흐름 점검",
  정책: "정책 변화 핵심",
  사회: "사회 현안 정리",
  해외: "해외 이슈 정리",
  가족: "가족 지원 정보",
  부부: "부부 관계 정보",
  회사: "직장 생활 정보",
  취미: "취미 생활 정보",
  친구: "친구 관계 정보"
};

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'");
}

function stripHtml(value) {
  return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sanitize(text, limit = 2000) {
  return String(text ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function formatKstDate(value) {
  const date = new Date(value);
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
  return formatted;
}

function parseItems(xml) {
  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  return itemBlocks
    .map((block) => {
      const title = stripHtml((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").replace(/\s+-\s+[^-]+$/, "").trim();
      const link = decodeHtml((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "");
      const description = stripHtml((block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || "");
      const pubDate = ((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || "").trim();
      const sourceName = stripHtml((block.match(/<source(?:\s[^>]*)?>([\s\S]*?)<\/source>/i) || [])[1] || "") || "출처 미상";

      if (!title || !link || !pubDate) {
        return null;
      }

      const publishedAt = new Date(pubDate).toISOString();
      const kstDate = formatKstDate(publishedAt);
      if (kstDate < START_KST || kstDate > TODAY_KST) {
        return null;
      }

      return {
        title,
        link,
        description,
        sourceName,
        publishedAt,
        kstDate
      };
    })
    .filter(Boolean);
}

function normalizeNewsTitle(title, sourceName = "") {
  return sanitize(title, 240)
    .replace(new RegExp(sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
    .replace(/\[(기고|칼럼|사설|오피니언|기자수첩)[^\]]*\]/giu, " ")
    .replace(/\{(기고|칼럼|사설|오피니언|기자수첩)[^}]*\}/giu, " ")
    .replace(/\((기고|칼럼|사설|오피니언|기자수첩)[^)]*\)/giu, " ")
    .replace(/(기고|칼럼|사설|오피니언|기자수첩)\s*\/?\s*[가-힣A-Za-z]+/giu, " ")
    .replace(/한눈에 보는 오늘의 뉴스/giu, " ")
    .replace(/오늘의 경제뉴스/giu, " ")
    .replace(/\d{4}년\s*\d{1,2}월\s*\d{1,2}일자/giu, " ")
    .replace(/\([^)]*\d+일[^)]*\)/g, " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/(뉴스1|네이트|뉴시스|연합뉴스|이데일리|머니투데이|아시아경제|매일경제|한국경제|조선일보|중앙일보|동아일보)\s*$/g, " ")
    .replace(/[“”"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasRelevantKeyword(item) {
  const keywords = MATCH_KEYWORDS[item.category]?.[item.subInterest] ?? [];
  if (keywords.length === 0) return true;
  const haystack = `${item.title} ${item.description} ${item.sourceName}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function isUsableNewsItem(item) {
  const cleanedTitle = normalizeNewsTitle(item.title, item.sourceName);
  const cleanedDescription = normalizeSummarySource(item.description, item.sourceName);

  if (BLOCKED_SOURCE_NAMES.has(item.sourceName)) {
    return false;
  }

  if (/nate|view\.nate|x\.com|brunch|aving|thekorea|twig24|russia-asean|frame-less|sisa-news|cj-ilbo|e-patentnews/i.test(item.sourceName)) {
    return false;
  }

  if (!cleanedTitle || cleanedTitle.length < 8) {
    return false;
  }

  if (/^[가-힣A-Za-z]+\(.*\)$/.test(cleanedTitle)) {
    return false;
  }

  if (/^\S+\(\d+일/.test(item.title)) {
    return false;
  }

  if (/뉴스1\.$/.test(cleanedDescription) || /^뉴스1$/.test(cleanedTitle)) {
    return false;
  }

  if (!cleanedDescription || cleanedDescription.length < 12) {
    return false;
  }

  if (/\[(기고|칼럼|사설|오피니언|기자수첩)/iu.test(item.title)) {
    return false;
  }

  if (
    /한눈에 보는 오늘의 뉴스|오늘의 경제뉴스|\d{4}년\s*\d{1,2}월\s*\d{1,2}일자|영상뉴스|포토뉴스|시론|칼럼|사설|라이브 업데이트|results on x|뉴스초대석|오늘의 주요뉴스|뉴스 브리핑|뉴스투데이/u.test(
      cleanedTitle
    )
  ) {
    return false;
  }

  if (/참가기업 모집|발대식|강연|특강 운영|연간 베스트 사무소|정례화 본격 가동|preview 영상|광고|협찬|results on x|jackbit|mp77|정품인증|하투하|그린친구/u.test(cleanedTitle)) {
    return false;
  }

  if (/TV|티브이|방송/.test(item.sourceName) || /TV|티브이/.test(cleanedTitle)) {
    return false;
  }

  if (/^\[[^\]]+\]/.test(item.title) && cleanedTitle.length < 16) {
    return false;
  }

  if (/이것|무조건|잡아라|뭐길래|이거|좋다더라|꼭 드세요/u.test(cleanedTitle)) {
    return false;
  }

  if (/^\d+\s*(주|조|개|분|원)\b/u.test(cleanedTitle)) {
    return false;
  }

  return true;
}

async function fetchGoogleNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} after:${START_KST} before:2026-04-08`)}&hl=ko&gl=KR&ceid=KR:ko`;
  const xml = execFileSync(
    "curl",
    ["-sL", "-A", "Mozilla/5.0 (compatible; SejulachimBot/1.0; +https://sejulachim.studiobyyou.kr)", url],
    { encoding: "utf8" }
  );

  return parseItems(xml);
}

function createSlug(category, subInterest, index) {
  const categorySlug = sanitize(category, 20)
    .toLowerCase()
    .replace(/\s+/g, "-");
  const subSlug = sanitize(subInterest, 20)
    .toLowerCase()
    .replace(/\s+/g, "-");
  return `real-${TODAY_KST}-${categorySlug}-${subSlug}-${index + 1}`;
}

function cleanHeadline(text, sourceName = "") {
  return normalizeNewsTitle(
    sanitize(text, 220)
      .replace(/^\[[^\]]+\]\s*/g, "")
      .replace(/\b[A-Za-z0-9.-]+\.(com|co\.kr|kr|net|org)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim(),
    sourceName
  );
}

function ensureSentence(text) {
  const value = sanitize(text, 260).replace(/\s+/g, " ").trim();
  if (!value) return "";
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function normalizeSummarySource(text, sourceName = "") {
  return cleanHeadline(text, sourceName)
    .replace(new RegExp(`\\b${escapeRegExp(sourceName)}\\b`, "gi"), " ")
    .replace(/\b([가-힣A-Za-z.-]+)\.(com|co\.kr|kr|net|org)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/,\s*/g, ", ")
    .trim();
}

function isMeaningfullyDifferent(left, right) {
  const a = normalizeSummarySource(left).replace(/[.,]/g, "");
  const b = normalizeSummarySource(right).replace(/[.,]/g, "");
  return Boolean(a && b && a !== b);
}

function buildDisplayTitle(title, subInterest) {
  const cleaned = normalizeSummarySource(title);
  if (subInterest === "혜택" && /국민연금공단|보험료 지원|청년/u.test(cleaned)) {
    return "청년 보험료 지원";
  }
  if (subInterest === "혈압" && /아침 10.?분|건강 루틴 5가지/u.test(cleaned)) {
    return "혈압 관리 루틴";
  }
  if (subInterest === "관절" && /어깨 통증|찌릿찌릿/u.test(cleaned)) {
    return "어깨 통증 신호";
  }
  if (subInterest === "연금" && /묵돈\s*6억|6억/u.test(cleaned)) {
    return "국민연금 수급";
  }
  const clauses = cleaned
    .split(/[:\-–—]|,\s*|…|\.\.\./)
    .map((part) => part.trim())
    .filter(Boolean);
  const preferred =
    clauses.find((part) => part.length >= 9 && part.length <= 18 && !/오늘의|한눈에 보는/.test(part)) ??
    clauses.find((part) => part.length >= 9 && part.length <= 22) ??
    clauses[0] ??
    cleaned;

  if (
    preferred.length >= 8 &&
    preferred.length <= 18 &&
    !/이것|무조건|잡아라|뭐길래|이거/u.test(preferred) &&
    !/^\d+\s*(주|조|개|분|원)\b/u.test(preferred)
  ) {
    return preferred;
  }

  const words = preferred.split(/\s+/);
  let built = "";
  for (const word of words) {
    const candidate = built ? `${built} ${word}` : word;
    if (candidate.length > 22) break;
    built = candidate;
  }

  const compact = sanitize(built || "", 24);
  if (compact.length >= 8 && !/^\d+\s*(주|조|개|분|원)\b/u.test(compact)) {
    return compact;
  }

  return TITLE_FALLBACKS[subInterest] ?? sanitize(`${subInterest} 핵심 정리`, 24);
}

function getShortSummary(title, description, category, subInterest) {
  const cleanedTitle = normalizeSummarySource(title);
  const cleanedDescription = normalizeSummarySource(description);
  const titleParts = cleanedTitle
    .split(/[:\-–—]|,\s*|…|\.\.\./)
    .map((part) => part.trim())
    .filter(Boolean);
  const firstPart = titleParts[0] ?? cleanedTitle;
  const secondPart = titleParts.slice(1).find((part) => part.length >= 6) ?? "";

  if (cleanedDescription && isMeaningfullyDifferent(cleanedDescription, cleanedTitle)) {
    const normalized = cleanedDescription
      .replace(new RegExp(cleanedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "")
      .replace(/^\s*[,:-]\s*/, "")
      .trim();
    if ((normalized || cleanedDescription).length >= 10) {
      return ensureSentence(normalized || cleanedDescription);
    }
  }

  if (/혈압/u.test(cleanedTitle) && /\d+가지|루틴|습관/u.test(cleanedTitle)) {
    return ensureSentence("아침 시간대 운동과 수면, 식사처럼 혈압에 닿는 생활 습관을 함께 점검하자는 내용입니다");
  }

  if (/국민연금공단|보험료 지원|청년/u.test(cleanedTitle) && subInterest === "혜택") {
    return ensureSentence("청년층이 실제로 받을 수 있는 보험료 지원과 신청 기준이 어떻게 달라지는지 짚은 내용입니다");
  }

  if (/묵돈\s*6억|6억/u.test(cleanedTitle) && subInterest === "연금") {
    return ensureSentence("연금 수급액 차이를 키우는 가입 기간과 소득 기준을 함께 설명한 내용입니다");
  }

  if (/어깨 통증|찌릿찌릿/u.test(cleanedTitle) && subInterest === "관절") {
    return ensureSentence("어깨 통증을 단순 근육통으로 넘기지 말고 신호와 점검 기준을 살펴보자는 내용입니다");
  }

  if (/연금/u.test(cleanedTitle) && /지원|혜택|보험료/u.test(cleanedTitle)) {
    return ensureSentence("청년층이 실제로 받을 수 있는 보험료 지원과 신청 조건이 어떻게 달라지는지 짚은 내용입니다");
  }

  if (/튀김|식품/u.test(cleanedTitle)) {
    return ensureSentence("같은 음식을 먹더라도 조리 방식과 재료 선택을 바꾸면 부담을 줄일 수 있다는 내용입니다");
  }

  if (secondPart && secondPart.length >= 6) {
    return ensureSentence(`${firstPart}와 관련해 ${secondPart}를 짚은 기사입니다`);
  }

  return ensureSentence(`${cleanedTitle}를 다룬 기사입니다`);
}

function getLongSummary(title, shortSummary, category, subInterest, summaryType) {
  const cleanedTitle = normalizeSummarySource(title);
  const categoryLineMap = {
    건강: `${subInterest} 주제는 증상, 검사, 생활 습관 중 무엇을 먼저 점검해야 하는지가 중요합니다.`,
    돈: `${subInterest} 주제는 금액, 시기, 대상, 서류처럼 실제 손익에 닿는 기준을 같이 봐야 합니다.`,
    실생활: `${subInterest} 주제는 오늘 바로 적용할 수 있는 행동 변화가 있는지 중심으로 읽는 편이 좋습니다.`,
    뉴스: `${subInterest} 주제는 큰 이슈보다 일정과 비용, 행정 변화처럼 생활 판단에 닿는 지점을 먼저 보는 편이 낫습니다.`,
    관계: `${subInterest} 주제는 제도보다 실제 대화와 준비, 역할 변화로 옮겨 생각해보면 더 이해가 쉽습니다.`
  };

  const lines = [
    shortSummary,
    ensureSentence(`${cleanedTitle}를 단순 제목으로 넘기지 말고 실제로 무엇이 달라지는지 중심으로 읽어볼 필요가 있습니다`),
    ensureSentence(
      summaryType === "MUST"
        ? "당장 확인해야 할 대상과 시기, 준비 항목이 무엇인지 먼저 짚어두는 편이 좋습니다"
        : "생활 속에서 바로 바뀌는 행동과 준비 포인트가 무엇인지 나눠 보는 편이 좋습니다"
    ),
    ensureSentence(categoryLineMap[category] ?? "누가 무엇을 바꾸거나 발표했는지와 내 생활에 어떤 영향이 있는지를 같이 봐야 합니다"),
    ensureSentence("해당 소식이 내 상황과 직접 닿는다면 적용 시기와 대상, 준비할 부분을 같이 체크해두는 편이 좋습니다."),
    ensureSentence("제목보다 실제 기준과 생활 변화, 준비할 부분을 함께 보는 데 의미가 있습니다.")
  ];

  return sanitize(lines.join(" "), 1800);
}

function getActionLine(category, subInterest) {
  const table = {
    건강: {
      혈압: "오늘은 혈압 숫자 하나만 적어두세요.",
      관절: "무릎이나 손목이 불편한 시간대를 먼저 체크해보세요.",
      음식: "한 끼만이라도 양과 시간을 같이 적어보세요.",
      상식: "바뀐 건강 정보가 내 생활에 바로 닿는지만 먼저 보세요.",
      병원: "방문 전 준비물과 예약 시간을 한 번 더 확인해보세요."
    },
    돈: {
      연금: "수급 시기와 준비 서류를 같이 메모해두세요.",
      세금: "마감일과 제출 서류 한 가지만 먼저 확인해보세요.",
      보험: "보장 범위와 빠지는 항목을 같이 비교해보세요.",
      주의: "오늘은 의심 문자나 전화 한 건만 더 조심해보세요.",
      혜택: "신청 조건과 기간을 먼저 체크해두세요."
    },
    실생활: {
      꿀팁: "오늘 바로 해볼 수 있는 한 가지만 골라보세요.",
      가전: "교체보다 관리로 해결되는 부분부터 먼저 보세요.",
      청소: "하루에 한 구역만 정리해도 충분합니다.",
      요리: "재료 하나만 바꿔도 생활이 편해질 수 있습니다.",
      교통: "출발 전에 시간표나 우회 정보부터 확인해보세요."
    },
    뉴스: {
      "주요 뉴스": "핵심 숫자나 일정 하나만 먼저 기억해두세요.",
      경제: "오늘은 물가나 금리처럼 생활비에 닿는 수치부터 보세요.",
      정책: "누가 대상인지와 언제 바뀌는지만 먼저 확인해보세요.",
      사회: "생활 동선에 직접 영향 있는지부터 체크해보세요.",
      해외: "국제 뉴스는 환율·유가처럼 생활에 닿는 부분부터 보세요."
    },
    관계: {
      가족: "집에서 바로 바뀔 수 있는 한 가지를 먼저 떠올려보세요.",
      부부: "대화가 필요한 지점을 한 문장으로 적어보세요.",
      회사: "업무 전달에서 놓친 부분이 있는지 점검해보세요.",
      취미: "부담 없이 이어갈 수 있는 방식인지 먼저 보세요.",
      친구: "연락 한 번이 필요한 사람부터 떠올려보세요."
    }
  };

  return table[category]?.[subInterest] ?? "오늘 내 생활에 바로 닿는 한 가지부터 확인해보세요.";
}

function summarizeFromSource({ title, description, sourceName, category, subInterest, summaryType }) {
  const rawText = sanitize(
    [
      `원문 제목: ${title}`,
      description ? `원문 요약: ${description}` : ""
    ]
      .filter(Boolean)
      .join("\n"),
    3000
  );

  const shortTitle = buildDisplayTitle(title, subInterest);
  const shortSummary = getShortSummary(title, description, category, subInterest);
  const longSummary = getLongSummary(title, shortSummary, category, subInterest, summaryType);

  return {
    title: shortTitle,
    shortSummary: sanitize(shortSummary, 300),
    longSummary,
    actionLine: sanitize(getActionLine(category, subInterest), 160),
    rawText
  };
}

async function main() {
  const rows = [];
  const summaryTypes = ["MUST", "USEFUL", "ACTION"];

  for (const [category, subMap] of Object.entries(TAXONOMY)) {
    for (const [subInterest, queries] of Object.entries(subMap)) {
      const seen = new Set();
      const candidates = [];

      for (const query of queries) {
        try {
          const items = await fetchGoogleNews(query);
          for (const item of items) {
            const key = `${item.title}|${item.link}`;
            if (seen.has(key)) continue;
            seen.add(key);
            if (!isUsableNewsItem(item)) continue;
            if (!hasRelevantKeyword({ ...item, category, subInterest })) continue;
            candidates.push(item);
          }
        } catch (error) {
          console.error(`[rss] ${category}/${subInterest}/${query}`, error instanceof Error ? error.message : error);
        }

        if (candidates.length >= 3) {
          break;
        }
      }

      for (const [index, item] of candidates
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 3)
        .entries()) {
        const summaryType = summaryTypes[index % summaryTypes.length];
        const summarized = summarizeFromSource({
          title: item.title,
          description: item.description,
          sourceName: item.sourceName,
          category,
          subInterest,
          summaryType
        });

        rows.push({
          slug: createSlug(category, subInterest, index),
          title: summarized.title,
          category: STORED_CATEGORY_BY_MAIN_INTEREST[category] ?? category,
          sub_interest: subInterest,
          summary_type: summaryType,
          source_name: item.sourceName,
          source_url: item.link,
          sources: [
            {
              name: item.sourceName,
              url: item.link,
              type: "news"
            }
          ],
          short_summary: summarized.shortSummary,
          long_summary: summarized.longSummary,
          action_line: summarized.actionLine,
          raw_text: summarized.rawText,
          approval_status: "approved",
          ai_status: "completed",
          summary_status: "done",
          published_at: item.publishedAt,
          thumbnail_url: null,
          thumbnail_alt: null,
          thumbnail_page_url: null,
          thumbnail_author: null,
          thumbnail_license: null,
          created_at: item.publishedAt,
          updated_at: new Date().toISOString()
        });
      }
    }
  }

  const { error: pickItemsError } = await supabase.from("daily_pick_items").delete().not("id", "is", null);
  if (pickItemsError) throw pickItemsError;

  const { error: picksError } = await supabase.from("daily_picks").delete().not("id", "is", null);
  if (picksError) throw picksError;

  const { error: contentError } = await supabase.from("content_items").delete().not("id", "is", null);
  if (contentError) throw contentError;

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("content_items").insert(rows);
    if (insertError) throw insertError;
  }

  const todayRows = rows.filter((row) => formatKstDate(row.published_at) === TODAY_KST);
  const groupedToday = {
    MUST: todayRows.find((item) => item.summary_type === "MUST") ?? null,
    USEFUL: todayRows.find((item) => item.summary_type === "USEFUL") ?? null,
    ACTION: todayRows.find((item) => item.summary_type === "ACTION") ?? null
  };

  const picked = Object.values(groupedToday).filter(Boolean);
  if (picked.length > 0) {
    const dailyPickId = crypto.randomUUID();
    const { error: pickError } = await supabase.from("daily_picks").insert({
      id: dailyPickId,
      pick_date: TODAY_KST,
      status: "ready",
      created_at: new Date().toISOString(),
      generated_at: new Date().toISOString()
    });
    if (pickError) throw pickError;

    const { data: insertedRows, error: insertedRowsError } = await supabase
      .from("content_items")
      .select("id, slug")
      .in("slug", picked.map((item) => item.slug));
    if (insertedRowsError) throw insertedRowsError;

    const pickItems = (insertedRows ?? []).map((item, index) => ({
      daily_pick_id: dailyPickId,
      content_item_id: item.id,
      position: index + 1
    }));

    if (pickItems.length > 0) {
      const { error: pickItemsInsertError } = await supabase.from("daily_pick_items").insert(pickItems);
      if (pickItemsInsertError) throw pickItemsInsertError;
    }
  }

  const countByCategory = Object.fromEntries(
    Object.keys(TAXONOMY).map((category) => [
      category,
      rows.filter((item) => (STORED_CATEGORY_BY_MAIN_INTEREST[category] ?? category) === item.category).length
    ])
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        count: rows.length,
        countByCategory,
        todayCount: todayRows.length,
        samples: rows.slice(0, 10).map((item) => ({
          title: item.title,
          category: item.category,
          sub_interest: item.sub_interest,
          source_name: item.source_name,
          source_url: item.source_url,
          published_at: item.published_at
        }))
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
