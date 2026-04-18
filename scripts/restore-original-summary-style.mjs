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

function sanitize(text, limit = 2000) {
  return String(text ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "·")
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeNewsTitle(title, sourceName = "") {
  return sanitize(title, 240)
    .replace(sourceName ? new RegExp(escapeRegExp(sourceName), "gi") : /$^/, "")
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
    .replace(/[“”"'`‘’｢｣]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

function normalizeSummarySource(text, sourceName = "") {
  return cleanHeadline(text, sourceName)
    .replace(sourceName ? new RegExp(`\\b${escapeRegExp(sourceName)}\\b`, "gi") : /$^/, " ")
    .replace(/\b([가-힣A-Za-z.-]+)\.(com|co\.kr|kr|net|org)\b/gi, " ")
    .replace(/^\|?\s*[가-힣A-Za-z\s]+=\s*[가-힣A-Za-z\s]+ 기자\s*\|?\s*/u, "")
    .replace(/^\[[^\]]*?기자\]\s*/u, "")
    .replace(/^\|?\s*[^|]{0,30}기자\s*\|?\s*/u, "")
    .replace(/현재 Internet Explorer 8이하 버전을 이용중이십니다\.?/giu, " ")
    .replace(/Internet Explorer\s*8\s*이하/giu, " ")
    .replace(/청와대 제공[^.。]*\.?/giu, " ")
    .replace(/종합지 대한뉴스[^.。]*\.?/giu, " ")
    .replace(/\s+/g, " ")
    .replace(/,\s*/g, ", ")
    .trim();
}

function ensureSentence(text, limit = 260) {
  const value = sanitize(text, limit).replace(/\s+/g, " ").trim();
  if (!value) return "";
  return /[.!?。]$/u.test(value) ? value : `${value}.`;
}

function isMeaningfullyDifferent(left, right) {
  const a = normalizeSummarySource(left).replace(/[.,]/g, "");
  const b = normalizeSummarySource(right).replace(/[.,]/g, "");
  return Boolean(a && b && a !== b);
}

function firstGoodSentence(text) {
  const blocked = /무단 전재|재배포 금지|저작권|구독|광고|제보|메일|사진=|자료=|Copyright|All rights reserved|Internet Explorer|현황판|청사 전경|청와대 제공|등록번호|on-off line/iu;
  return sanitize(text, 4000)
    .split(/(?<=[.!?。]|다\.|요\.)\s+/u)
    .map((part) => normalizeSummarySource(part))
    .find((part) => part.length >= 20 && !blocked.test(part) && !/^\[[^\]]+\]/.test(part));
}

function getRawField(rawText, label) {
  const match = String(rawText ?? "").match(new RegExp(`${label}:\\s*([^\\n]+)`, "u"));
  return sanitize(match?.[1] ?? "", 1000);
}

function getRawBody(rawText) {
  const match = String(rawText ?? "").match(/원문 본문:\s*([\s\S]*)/u);
  return sanitize(match?.[1] ?? "", 8000);
}

function getShortSummary(title, description, category, subInterest, rawText) {
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
      .replace(new RegExp(escapeRegExp(cleanedTitle), "g"), "")
      .replace(/^\s*[,:-]\s*/, "")
      .trim();
    if ((normalized || cleanedDescription).length >= 10) {
      return ensureSentence(normalized || cleanedDescription, 170);
    }
  }

  const bodySentence = firstGoodSentence(getRawBody(rawText));
  if (bodySentence) {
    return ensureSentence(bodySentence, 170);
  }

  if (/혈압/u.test(cleanedTitle) && /\d+가지|루틴|습관/u.test(cleanedTitle)) {
    return ensureSentence("아침 시간대 운동과 수면, 식사처럼 혈압에 닿는 생활 습관을 함께 점검하자는 내용입니다", 170);
  }

  if (/국민연금공단|보험료 지원|청년/u.test(cleanedTitle) && subInterest === "혜택") {
    return ensureSentence("청년층이 실제로 받을 수 있는 보험료 지원과 신청 기준이 어떻게 달라지는지 짚은 내용입니다", 170);
  }

  if (/묵돈\s*6억|6억/u.test(cleanedTitle) && subInterest === "연금") {
    return ensureSentence("연금 수급액 차이를 키우는 가입 기간과 소득 기준을 함께 설명한 내용입니다", 170);
  }

  if (/어깨 통증|찌릿찌릿/u.test(cleanedTitle) && subInterest === "관절") {
    return ensureSentence("어깨 통증을 단순 근육통으로 넘기지 말고 신호와 점검 기준을 살펴보자는 내용입니다", 170);
  }

  if (/연금/u.test(cleanedTitle) && /지원|혜택|보험료/u.test(cleanedTitle)) {
    return ensureSentence("청년층이 실제로 받을 수 있는 보험료 지원과 신청 조건이 어떻게 달라지는지 짚은 내용입니다", 170);
  }

  if (/튀김|식품/u.test(cleanedTitle)) {
    return ensureSentence("같은 음식을 먹더라도 조리 방식과 재료 선택을 바꾸면 부담을 줄일 수 있다는 내용입니다", 170);
  }

  if (secondPart && secondPart.length >= 6) {
    return ensureSentence(`${firstPart}와 관련해 ${secondPart}를 짚은 기사입니다`, 170);
  }

  return ensureSentence(`${cleanedTitle || title}를 다룬 기사입니다`, 170);
}

function getLongSummary(title, shortSummary, category, subInterest, summaryType) {
  return sanitize(shortSummary, 500);
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

const TITLE_PATCHES = {
  "real-2026-04-15-뉴스-사회-1": "주사기 수급 점검",
  "real-2026-04-15-뉴스-경제-1": "수입물가 급등",
  "real-2026-04-15-실생활-가전-1": "장애인 맞춤 가전",
  "real-2026-04-15-뉴스-해외-1": "중동 가짜뉴스 경계",
  "real-2026-04-15-실생활-교통-1": "고터 횡단보도 논쟁",
  "real-2026-04-15-건강-음식-1": "가성비 건강식품",
  "real-2026-04-15-뉴스-주요-뉴스-1": "휴전협상·수입물가",
  "real-2026-04-15-건강-상식-1": "일본 의사 유루캐리",
  "real-2026-04-15-실생활-청소-1": "봄맞이 청소 이벤트",
  "real-2026-04-15-관계-친구-1": "수면과 친구 교류",
  "real-2026-04-15-뉴스-정책-1": "대중교통 공약 경쟁",
  "real-2026-04-15-돈-보험-1": "농업인 보험 지원",
  "real-2026-04-15-관계-부부-1": "사실혼 재산분할",
  "real-2026-04-15-돈-주의-1": "토스뱅크 설패스",
  "real-2026-04-15-돈-세금-1": "종소세 계산기",
  "real-2026-04-15-실생활-꿀팁-1": "스위치 수납 팁",
  "real-2026-04-15-돈-혜택-1": "광주 교통비 지원",
  "real-2026-04-15-관계-가족-1": "온가족보듬 나들이",
  "real-2026-04-15-관계-회사-1": "은둔청년 사회복귀",
  "real-2026-04-15-실생활-요리-1": "진미채 레시피",
  "real-2026-04-15-건강-관절-1": "무릎수술 시기",
  "real-2026-04-15-관계-취미-1": "취미도시 성남",
  "real-2026-04-15-건강-병원-1": "외국인 안심병원",
  "real-2026-04-15-건강-혈압-1": "폐경 후 혈압관리",
  "real-2026-04-15-돈-연금-1": "기초연금 편법 차단"
};

const SUMMARY_PATCHES = {
  "real-2026-04-15-뉴스-사회-1":
    "복지부 장관이 의료 현장의 주사기 수급 상황을 점검했습니다.",
  "real-2026-04-15-뉴스-경제-1":
    "국제유가와 환율 상승 여파로 3월 수입물가가 전달보다 16.1% 올랐습니다.",
  "real-2026-04-15-실생활-가전-1":
    "비스포크 가전이 색상 선택을 넘어 생활양식과 주거 공간에 맞춘 맞춤형 가전 개념으로 확장되고 있습니다.",
  "real-2026-04-15-뉴스-해외-1":
    "중동 이슈를 악용한 가짜뉴스와 피싱 위험에 경찰이 대응 상황을 점검했습니다.",
  "real-2026-04-15-돈-보험-1":
    "이천시가 농업인안전재해보험과 농기계종합보험 지원을 본격 추진합니다.",
  "real-2026-04-15-돈-주의-1":
    "토스뱅크가 비대면 금융거래의 보이스피싱 위험 신호를 잡기 위해 통신사 인증 솔루션 설패스를 도입했습니다.",
  "real-2026-04-15-돈-세금-1":
    "쌤157이 종합소득세 예상 세액을 비교할 수 있는 계산기 서비스를 출시했습니다.",
  "real-2026-04-15-건강-상식-1":
    "일본 의료계에서 당직과 휴일 근무를 줄이는 유루캐리 흐름이 확산되고 있습니다.",
  "real-2026-04-15-실생활-꿀팁-1":
    "테무 제품을 활용해 닌텐도 스위치 주변기기를 정리하는 수납 팁이 소개됐습니다.",
  "real-2026-04-15-실생활-교통-1":
    "고터 사거리에 횡단보도가 설치되며 보행 편의와 교통 혼잡 논쟁이 나왔습니다.",
  "real-2026-04-15-뉴스-정책-1":
    "서울시장 후보들이 대중교통비 부담 완화와 환급 정책을 내놓았습니다.",
  "real-2026-04-15-돈-혜택-1":
    "광주시가 고유가 부담을 줄이기 위해 4월부터 9월까지 K-패스와 G-패스 대중교통비 지원을 확대합니다.",
  "real-2026-04-15-관계-가족-1":
    "영덕군가족센터가 가족 관계 회복을 돕는 문화체험 나들이 프로그램을 진행했습니다.",
  "real-2026-04-15-실생활-청소-1":
    "KB국민카드가 봄철 집안 정리를 겨냥해 로보락과 청소용품 경품 이벤트를 진행합니다.",
  "real-2026-04-15-관계-회사-1":
    "고립·은둔 청년들이 가상회사 프로젝트를 통해 출근과 업무 경험을 시작했습니다.",
  "real-2026-04-15-실생활-요리-1":
    "선예가 볶지 않고 만드는 진미채 반찬 레시피와 양념 구성을 소개했습니다.",
  "real-2026-04-15-건강-관절-1":
    "퇴행성 관절염 말기에는 통증과 기능 저하를 함께 보고 수술 시기를 판단해야 합니다.",
  "real-2026-04-15-관계-취미-1":
    "성남시가 취미가 같은 1인 가구 동아리에 연간 최대 70만원 활동비를 지원합니다.",
  "real-2026-04-15-건강-음식-1":
    "매일 챙기기 쉬운 가성비 건강식품과 꾸준한 식습관의 중요성이 소개됐습니다.",
  "real-2026-04-15-건강-병원-1":
    "전남 외국인 안심병원이 건강보험이 없는 외국인 환자에게 의료비를 지원했습니다.",
  "real-2026-04-15-관계-부부-1":
    "사실혼 재산분할에서는 공동생활과 재산 형성 기여를 입증하는 과정이 중요합니다.",
  "real-2026-04-15-돈-연금-1":
    "정부가 해외 금융자산과 가상자산을 기초연금 소득인정액에 반영하는 방안을 추진합니다.",
  "real-2026-04-15-건강-혈압-1":
    "폐경 후 비만과 대사증후군이 함께 있으면 유방암 위험이 높아진다는 연구 결과가 나왔습니다.",
  "real-2026-04-15-뉴스-주요-뉴스-1":
    "휴전협상과 수입물가 상승처럼 국제 정세와 생활 물가에 닿는 주요 흐름이 함께 다뤄졌습니다.",
  "real-2026-04-15-관계-친구-1":
    "수면 시간과 친구 교류 같은 생활 요인이 우울감과 관련 있다는 조사 결과가 나왔습니다."
};

const env = {
  ...loadEnvFile(".env.local"),
  ...process.env
};

const TARGET_DATE = process.env.CONTENT_SEED_DATE?.trim() || "2026-04-15";
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const { data, error } = await supabase
    .from("content_items")
    .select("id, slug, title, category, sub_interest, source_name, raw_text, summary_type")
    .like("slug", `real-${TARGET_DATE}-%`);

  if (error) throw error;

  const updates = [];
  for (const item of data ?? []) {
    const rawTitle = getRawField(item.raw_text, "원문 제목") || item.title;
    const rawSummary = getRawField(item.raw_text, "원문 요약");
    const title = TITLE_PATCHES[item.slug] ?? item.title;
    const shortSummary = ensureSentence(
      SUMMARY_PATCHES[item.slug] ??
        getShortSummary(rawTitle, rawSummary, item.category, item.sub_interest, item.raw_text),
      180
    );
    const longSummary = getLongSummary(title, shortSummary, item.category, item.sub_interest, item.summary_type);
    const actionLine = getActionLine(item.category, item.sub_interest);

    const payload = {
      title,
      short_summary: sanitize(shortSummary, 220),
      long_summary: longSummary,
      action_line: actionLine,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase.from("content_items").update(payload).eq("id", item.id);
    if (updateError) throw updateError;
    updates.push({ slug: item.slug, title, short_summary: payload.short_summary });
  }

  console.log(JSON.stringify({ ok: true, count: updates.length, updates }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
