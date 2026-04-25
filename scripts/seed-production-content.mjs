import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

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

function requireExplicitWriteApproval() {
  const approved = env.ALLOW_PRODUCTION_CONTENT_SEED?.trim().toLowerCase();
  if (approved === "1" || approved === "true" || approved === "yes" || approved === "on") {
    return;
  }

  throw new Error("이 스크립트는 운영 콘텐츠를 덮어쓸 수 있습니다. ALLOW_PRODUCTION_CONTENT_SEED=true 설정 후 다시 실행하세요.");
}

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_ENV_MISSING");
}

requireExplicitWriteApproval();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const imageUrl = `${env.APP_URL || "https://sejulachim.studiobyyou.kr"}/sejulachim-seo.jpg`;

const items = [
  {
    slug: "brief-health-routine-apr07",
    title: "아침 스트레칭 5분만 해도 몸이 덜 굳는다는 이유",
    category: "건강",
    sub_interest: "마음건강",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-health-routine-apr07",
    short_summary: "기상 직후 5분 정도의 가벼운 스트레칭은 몸의 긴장을 풀고 하루 첫 움직임을 훨씬 편하게 만들어줍니다.",
    long_summary: "아침 건강 루틴을 다룬 기사들을 보면 가장 자주 등장하는 조언 중 하나가 짧은 스트레칭입니다. 잠에서 깬 직후 몸은 아직 굳어 있고, 갑자기 앉거나 걷기 시작하면 뻣뻣함이 오래 남기 쉽습니다. 이때 목, 어깨, 허리, 종아리를 중심으로 5분만 천천히 움직여도 몸의 긴장이 풀리기 시작합니다. 강도 높은 운동과 달리 실패 부담이 적고, 집 안에서도 바로 할 수 있다는 점이 장점입니다. 스트레칭은 몸뿐 아니라 마음에도 여유를 줍니다. 바쁘게 시작하는 아침일수록 이런 짧은 루틴이 하루의 속도를 조절해줍니다. 오늘은 큰 결심보다 먼저, 자리에서 일어나 팔과 어깨를 천천히 움직이는 것부터 시작해볼 만합니다.",
    action_line: "내일 아침에는 스트레칭 5분부터 시작해보세요.",
    raw_text: "아침 스트레칭과 몸의 긴장을 푸는 생활 루틴에 대한 기사입니다.",
    published_at: "2026-04-07T07:20:00+09:00"
  },
  {
    slug: "brief-money-budget-apr07",
    title: "이번 주 예산은 하루 단위로 쪼개보는 편이 지키기 쉽습니다",
    category: "돈",
    sub_interest: "생활비",
    summary_type: "USEFUL",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-money-budget-apr07",
    short_summary: "일주일 예산이 막연하게 느껴질 때는 하루 평균 사용 가능 금액으로 바꿔보는 방식이 실제 지출 관리에 더 도움이 됩니다.",
    long_summary: "생활비를 관리할 때 많은 사람들이 주간 예산을 한 번에 세우지만, 막상 실제 소비는 하루 단위로 일어나기 때문에 감각이 잘 맞지 않는 경우가 많습니다. 최근 재무 기사들을 보면 일주일 예산을 하루 평균 금액으로 나눠보는 방식이 지키기 더 쉽다고 설명합니다. 오늘 쓸 수 있는 범위를 알면 커피, 장보기, 외식 선택이 더 선명해지기 때문입니다. 특히 월초에는 아직 시간이 많다고 느껴져 지출이 느슨해지기 쉬운데, 하루 기준이 있으면 속도를 조절하기 좋습니다. 세부 가계부를 오래 못 쓰는 사람에게도 적용하기 쉬운 방법입니다. 숫자를 정교하게 맞추는 것보다 감각을 만드는 데 효과적입니다.",
    action_line: "이번 주 예산을 하루 평균 금액으로 한 번 나눠보세요.",
    raw_text: "주간 예산을 하루 기준으로 바꾸는 생활비 관리 기사입니다.",
    published_at: "2026-04-07T08:40:00+09:00"
  },
  {
    slug: "brief-news-morning-apr07",
    title: "아침 뉴스는 일정에 바로 영향을 주는 소식부터 보는 게 좋습니다",
    category: "뉴스",
    sub_interest: "국내이슈",
    summary_type: "MUST",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-news-morning-apr07",
    short_summary: "아침에 뉴스를 볼 때는 큰 이슈보다 교통, 날씨, 제도 공지처럼 오늘 일정에 영향을 주는 정보부터 확인하는 편이 실용적입니다.",
    long_summary: "출근 전이나 아침 식사 시간에 보는 뉴스는 양보다 순서가 중요합니다. 이번 주 아침 브리핑 관련 기사들을 보면, 생활에 즉시 영향을 주는 정보를 먼저 확인하는 습관이 하루 피로를 줄여준다고 정리합니다. 교통 공지, 날씨 변화, 병원과 학교 일정, 행정 서비스 점검 소식은 오늘 움직임을 바로 바꿀 수 있기 때문입니다. 반면 큰 사회 이슈는 맥락이 중요해 시간이 더 필요합니다. 따라서 아침에는 즉시성 높은 정보부터 짧게 보고, 깊이 있는 뉴스는 저녁에 따로 보는 방식이 현실적입니다. 같은 뉴스 소비라도 시간대에 맞는 우선순위가 있는 셈입니다.",
    action_line: "아침 뉴스는 오늘 일정에 영향 주는 정보부터 먼저 확인하세요.",
    raw_text: "아침 뉴스 소비 순서와 생활 영향에 대한 기사입니다.",
    published_at: "2026-04-07T09:00:00+09:00"
  },
  {
    slug: "brief-health-walking-apr06",
    title: "아침 15분 걷기가 집중력 회복에 도움이 된다는 정리",
    category: "건강",
    sub_interest: "걷기",
    summary_type: "MUST",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-health-walking-apr06",
    short_summary: "아침 햇빛을 받으며 15분 정도 걷는 습관은 몸을 천천히 깨우고 오전 집중력을 안정적으로 끌어올리는 데 도움이 됩니다.",
    long_summary: "일주일 동안 아침 루틴 관련 국내외 보도와 건강 칼럼을 정리해보면, 무리한 운동보다 짧고 규칙적인 걷기가 실제 생활에 더 잘 붙는다는 공통점이 보입니다. 특히 잠에서 깬 뒤 1시간 안에 10~15분 정도만 움직여도 몸이 낮 시간 모드로 전환되기 쉬워집니다. 밝은 빛을 받으며 걷는 행동이 수면 리듬을 정리하고, 앉아서 시작한 날보다 몸의 긴장을 덜어준다는 설명도 많았습니다. 헬스장에 가야 한다는 부담 없이 집 주변을 한 바퀴 도는 수준이면 충분하다는 점도 장점입니다. 비가 오거나 바깥 일정이 어려운 날에는 복도나 실내 계단을 천천히 걷는 대안도 가능합니다. 중요한 것은 강도가 아니라 반복성입니다. 오늘 하루 컨디션이 무겁게 느껴진다면, 출근 전이나 아침 식사 후 15분 산책부터 실험해볼 만합니다.",
    action_line: "내일 아침 일정에 15분 산책 시간을 먼저 넣어보세요.",
    raw_text: "아침 산책과 집중력, 수면 리듬, 가벼운 운동 습관에 관한 생활형 정리 기사입니다.",
    published_at: "2026-04-06T07:30:00+09:00"
  },
  {
    slug: "brief-money-tax-documents-apr06",
    title: "4월 초 절세 서류 정리를 먼저 해두면 편한 이유",
    category: "돈",
    sub_interest: "절세",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-money-tax-documents-apr06",
    short_summary: "4월 초에 영수증과 공제 관련 문서를 한 번만 모아두면 이후 신고와 확인 과정에서 시간을 크게 줄일 수 있습니다.",
    long_summary: "봄철에는 연금, 의료비, 카드 사용 내역처럼 해마다 다시 확인해야 하는 절세 자료가 늘어납니다. 막상 필요할 때 찾아보려 하면 앱과 메일, 종이 서류가 흩어져 있어 시간이 많이 들기 쉽습니다. 이번 주 생활 재무 관련 보도들을 종합하면, 금액을 복잡하게 계산하기 전에 자료를 한곳에 모으는 작업이 가장 먼저 권장됩니다. 특히 본인 지출뿐 아니라 부모님 병원비나 자녀 교육비처럼 가족과 연결되는 항목은 미리 분리해두는 것이 좋습니다. 파일명을 월별로 맞추거나 공제 항목별 폴더를 만드는 방식만으로도 다음 작업이 훨씬 쉬워집니다. 절세는 새로운 상품을 찾는 것보다 이미 받을 수 있는 항목을 놓치지 않는 것이 더 중요할 때가 많습니다. 오늘은 10분만 써서 세금 관련 문서 보관 폴더를 정리해두는 것이 실질적인 첫걸음입니다.",
    action_line: "카드, 의료비, 기부금 자료부터 한 폴더로 모아두세요.",
    raw_text: "절세 준비를 위한 생활 서류 정리와 일정 관리에 대한 기사입니다.",
    published_at: "2026-04-06T09:10:00+09:00"
  },
  {
    slug: "brief-news-local-transit-apr06",
    title: "이번 주 지역 교통 공사 일정이 생활 동선에 미치는 영향",
    category: "뉴스",
    sub_interest: "지역 소식",
    summary_type: "USEFUL",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-news-local-transit-apr06",
    short_summary: "지역별 버스 우회와 도로 공사 일정은 출퇴근과 병원 방문 시간을 바꿀 수 있어 미리 확인해둘 가치가 큽니다.",
    long_summary: "지역 소식 가운데 가장 체감이 큰 것은 거창한 사건보다 생활 동선을 바꾸는 공지입니다. 이번 주 여러 지자체와 교통기관 공지를 살펴보면 야간 공사, 버스 우회, 정류장 임시 이전처럼 일정에 직접 영향을 주는 정보가 많았습니다. 특히 병원 예약이나 부모님 이동이 있는 날에는 평소보다 여유 시간을 더 잡아야 할 수 있습니다. 문제는 이런 안내가 짧게 지나가거나 여러 채널로 흩어져 있다는 점입니다. 평소 자주 쓰는 노선 두세 개만 따로 체크해두면 갑작스러운 지각이나 이동 스트레스를 줄일 수 있습니다. 뉴스라고 해서 거창한 이슈만 볼 필요는 없습니다. 오히려 지역 교통과 생활 편의 공지를 먼저 챙기는 것이 하루를 덜 꼬이게 만듭니다.",
    action_line: "이번 주 자주 타는 노선의 공지사항을 한 번 확인해보세요.",
    raw_text: "지역 교통 공지와 생활 동선 변화에 대한 생활 밀착형 기사입니다.",
    published_at: "2026-04-06T11:40:00+09:00"
  },
  {
    slug: "brief-hobby-book-apr05",
    title: "하루 10쪽 독서가 마음을 가라앉히는 데 도움이 되는 이유",
    category: "취미",
    sub_interest: "책",
    summary_type: "USEFUL",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-hobby-book-apr05",
    short_summary: "하루 10쪽 정도의 짧은 독서만으로도 밤 시간을 덜 산만하게 쓰고 마음을 정리하는 데 도움이 됩니다.",
    long_summary: "책 읽기 습관은 많은 사람들이 좋다고 생각하지만 실제로는 긴 시간을 내지 못해 미루기 쉽습니다. 이번 주 문화와 생활 습관 관련 글들을 살펴보면, 하루 10쪽처럼 아주 작은 기준을 세우는 방식이 가장 오래 간다는 공통점이 보입니다. 중요한 것은 완독이 아니라 리듬입니다. 자기 전 10분 독서는 화면 노출 시간을 줄이고, 머리를 다른 생각에서 잠시 떼어놓는 데 도움을 줍니다. 종이책이 어렵다면 전자책 한 챕터도 괜찮지만, 너무 긴 텍스트보다 짧고 흐름이 끊기지 않는 분량이 좋습니다. 독서 노트를 거창하게 만들 필요도 없습니다. 오늘 읽은 문장 하나를 표시해두는 정도면 충분합니다. 바쁜 주말일수록 이런 작은 취미가 다음 주의 피로를 낮추는 역할을 할 수 있습니다.",
    action_line: "오늘 밤에는 책 10쪽만 읽는 것으로 기준을 낮춰보세요.",
    raw_text: "작은 독서 습관과 밤 시간 정리에 관한 기사입니다.",
    published_at: "2026-04-05T08:20:00+09:00"
  },
  {
    slug: "brief-family-schedule-apr05",
    title: "가족 일정은 공유 메모 하나로도 충돌을 줄일 수 있습니다",
    category: "가족",
    sub_interest: "집안 일정",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-family-schedule-apr05",
    short_summary: "병원 예약, 학원 일정, 장보기 같은 생활 일정을 한 메모에 모아두면 가족 간 반복 확인을 줄일 수 있습니다.",
    long_summary: "가족과 함께 사는 집에서는 작은 일정 하나가 여러 사람의 시간을 바꾸곤 합니다. 이번 주 생활 관련 보도를 모아보면, 갈등의 원인이 큰 사건보다도 전달되지 않은 일정이나 서로 다르게 이해한 약속인 경우가 많았습니다. 이를 줄이는 가장 쉬운 방법은 메신저 대화방에 흩어진 정보를 하나의 공유 메모나 캘린더로 모으는 것입니다. 누가 누구를 데리러 가는지, 병원 예약은 몇 시인지, 이번 주 장보기 품목은 무엇인지 같은 정보만 정리해도 반복 질문이 크게 줄어듭니다. 완벽한 시스템보다 모두가 쉽게 보는 장소를 정하는 것이 중요합니다. 특히 부모 돌봄이나 자녀 학원 일정이 겹칠수록 작은 기록이 큰 혼선을 막아줍니다. 이번 주말에 다음 주의 필수 일정만 한 번 정리해두면 체감이 다를 수 있습니다.",
    action_line: "다음 주 필수 일정 세 가지만 가족 공유 메모에 적어두세요.",
    raw_text: "가족 일정 공유와 생활 커뮤니케이션에 대한 기사입니다.",
    published_at: "2026-04-05T10:00:00+09:00"
  },
  {
    slug: "brief-health-sleep-apr05",
    title: "잠들기 30분 전 화면 끄기가 실제로 체감되는 이유",
    category: "건강",
    sub_interest: "수면",
    summary_type: "MUST",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-health-sleep-apr05",
    short_summary: "취침 직전 화면 사용을 줄이면 잠드는 시간이 짧아지고 다음 날 아침 피로감도 덜 남는 경우가 많습니다.",
    long_summary: "수면 관련 기사와 전문가 칼럼을 보면 거의 빠지지 않는 조언이 바로 취침 직전 화면 사용 줄이기입니다. 이유는 단순합니다. 밝은 화면과 자극적인 정보가 뇌를 깨어 있게 만들기 때문입니다. 특히 짧은 영상이나 실시간 뉴스는 생각을 멈추기 어렵게 만들어 몸은 누워 있어도 긴장이 이어집니다. 반면 잠들기 30분 전부터 조명을 낮추고 화면을 멀리하면 몸이 수면 모드로 넘어가기 쉬워집니다. 꼭 독서나 명상을 해야 하는 것은 아닙니다. 따뜻한 물을 마시거나 다음 날 입을 옷을 정리하는 정도의 조용한 행동이면 충분합니다. 수면의 질은 한 번에 확 좋아지기보다 며칠의 반복으로 차이가 드러나는 경우가 많습니다. 이번 주 피곤함이 누적됐다면 밤 시간 화면 사용부터 먼저 줄여볼 만합니다.",
    action_line: "오늘은 잠들기 30분 전부터 휴대폰을 멀리 두세요.",
    raw_text: "수면 위생과 밤 시간 화면 사용에 대한 생활형 기사입니다.",
    published_at: "2026-04-05T21:10:00+09:00"
  },
  {
    slug: "brief-money-livingcost-apr04",
    title: "장보기 전에 가격 기준 품목 5개만 정하면 생활비 관리가 쉬워집니다",
    category: "돈",
    sub_interest: "생활비",
    summary_type: "MUST",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-money-livingcost-apr04",
    short_summary: "자주 사는 품목 다섯 개만 기준 가격을 기억해두면 체감 물가를 더 빨리 읽고 충동구매도 줄일 수 있습니다.",
    long_summary: "생활비 관리가 어려운 이유 중 하나는 지출이 커서라기보다 기준이 없어서입니다. 이번 주 물가 관련 보도들을 종합해보면, 전체 가격표를 다 외우기보다 자주 사는 품목 몇 개를 기준 가격으로 잡아두는 방법이 가장 실용적입니다. 예를 들어 우유, 달걀, 두부, 사과, 세제처럼 반복 구매 품목을 정하고 최근 가격대를 기억해두면 할인인지 단순 진열가인지 판단하기 쉬워집니다. 장보기를 갈 때마다 모든 품목을 고민하지 않아도 되는 점도 장점입니다. 외식과 배달도 비슷합니다. 자주 주문하는 메뉴 두세 개의 가격만 기억해도 체감 지출이 훨씬 또렷해집니다. 생활비는 거창한 가계부보다 기준을 세우는 것에서 관리가 시작됩니다.",
    action_line: "자주 사는 품목 5개의 최근 가격을 메모해두세요.",
    raw_text: "생활비 관리와 기준 가격 설정에 대한 기사입니다.",
    published_at: "2026-04-04T07:50:00+09:00"
  },
  {
    slug: "brief-news-policy-apr04",
    title: "4월부터 달라지는 생활 제도는 신청 기한부터 보는 것이 좋습니다",
    category: "뉴스",
    sub_interest: "정책 변화",
    summary_type: "MUST",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-news-policy-apr04",
    short_summary: "새 제도나 지원 정책은 내용보다 신청 기한과 대상 조건을 먼저 확인해야 실제로 놓치는 일을 줄일 수 있습니다.",
    long_summary: "정책 뉴스는 중요해 보여도 읽다 보면 내게 해당되는지 헷갈리는 경우가 많습니다. 최근 발표된 생활 지원과 행정 변경 소식들을 보면, 핵심은 긴 설명보다 신청 대상과 기한, 준비 서류였습니다. 특히 지원금이나 감면 제도는 대상 조건을 한 줄로 정확히 읽는 것이 중요합니다. 공고를 다 읽지 못하더라도 기한과 신청 채널부터 체크하면 다음 행동이 분명해집니다. 부모님이나 가족을 대신해 챙겨야 하는 경우라면 더더욱 필요합니다. 뉴스는 정보를 넓게 아는 것보다 필요한 순간 놓치지 않는 것이 실용적입니다. 이번 주 정책 변화가 보이면 제목만 넘기지 말고 기한과 대상만이라도 먼저 확인해두는 습관이 도움이 됩니다.",
    action_line: "정책 기사에서는 기한, 대상, 신청처 세 줄만 먼저 확인하세요.",
    raw_text: "생활형 정책 변화와 신청 정보 확인에 대한 기사입니다.",
    published_at: "2026-04-04T10:30:00+09:00"
  },
  {
    slug: "brief-hobby-photo-apr04",
    title: "하루 한 장 사진 기록이 기억을 붙잡는 가장 쉬운 방법",
    category: "취미",
    sub_interest: "사진",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-hobby-photo-apr04",
    short_summary: "하루 한 장의 사진만 남겨도 그날의 분위기와 감정을 다시 떠올리기가 훨씬 쉬워집니다.",
    long_summary: "사진 취미를 거창하게 시작하려고 하면 장비나 구도부터 부담이 커집니다. 하지만 이번 주 취미 관련 기사들을 보면, 사진의 가장 큰 장점은 잘 찍는 것보다 남기는 데 있습니다. 출근길 하늘, 오늘 먹은 점심, 집 앞 꽃처럼 사소한 장면을 하루 한 장만 기록해도 나중에 돌아봤을 때 그날의 흐름이 선명하게 남습니다. 특히 바쁜 시기일수록 시간이 어떻게 지나갔는지 기억이 흐릿해지기 쉬운데, 사진 한 장은 하루의 표식을 만들어줍니다. 잘 찍으려고 멈추기보다 꾸준히 찍을 수 있는 장면을 찾는 편이 오래 갑니다. 주말 저녁에 이번 주 사진을 한 번 넘겨보면 생각보다 생활 패턴도 잘 보입니다.",
    action_line: "오늘 가장 기억하고 싶은 장면 한 장만 남겨보세요.",
    raw_text: "일상 사진 기록과 취미 지속성에 관한 기사입니다.",
    published_at: "2026-04-04T18:10:00+09:00"
  },
  {
    slug: "brief-family-parents-apr03",
    title: "부모님 병원 동행은 메모 한 장으로 훨씬 편해집니다",
    category: "가족",
    sub_interest: "부모 돌봄",
    summary_type: "USEFUL",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-family-parents-apr03",
    short_summary: "증상 변화와 복용 약을 간단히 적어두면 병원 동행 시 설명이 쉬워지고 진료도 덜 복잡해집니다.",
    long_summary: "부모님 병원 일정은 자주 있는 일은 아니어도 막상 가면 준비할 것이 많습니다. 이번 주 가족 돌봄 관련 글들을 보면, 보호자가 가장 힘들어하는 부분은 갑자기 질문을 받았을 때 필요한 정보를 정확히 설명하는 일입니다. 최근 증상 변화, 복용 중인 약, 이전 검사 일정 같은 핵심 정보만 메모로 정리해두어도 진료실에서 훨씬 여유가 생깁니다. 보호자가 여러 명일 때는 누가 어떤 내용을 알고 있는지 달라져 설명이 엇갈리기도 합니다. 이럴수록 병원 전용 메모를 하나 두고 필요할 때마다 업데이트하는 방식이 실용적입니다. 부모님 입장에서도 같은 질문을 반복해서 답하지 않아도 되어 부담이 줄어듭니다. 돌봄은 큰 결심보다 작은 준비가 체감을 바꿉니다.",
    action_line: "다음 병원 전에 약 목록과 최근 증상만 메모해두세요.",
    raw_text: "부모 돌봄과 병원 동행 준비에 대한 기사입니다.",
    published_at: "2026-04-03T09:00:00+09:00"
  },
  {
    slug: "brief-health-diet-apr03",
    title: "식단 기록은 칼로리보다 시간대부터 적는 것이 오래 갑니다",
    category: "건강",
    sub_interest: "식단",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-health-diet-apr03",
    short_summary: "무엇을 얼마나 먹었는지보다 언제 자주 무너지는지부터 적어보면 식습관 개선이 훨씬 쉬워집니다.",
    long_summary: "식단 기록은 시작할 때 가장 의욕적이지만 오래 유지하기가 어렵습니다. 이번 주 건강 습관 관련 기사들을 보면, 처음부터 세세한 칼로리 계산으로 들어가기보다 시간대와 간식 패턴을 보는 방식이 오래 간다고 설명합니다. 예를 들어 오후 4시마다 단 것이 당긴다거나 밤 10시 이후 야식이 반복된다는 사실을 알게 되면 원인을 더 쉽게 파악할 수 있습니다. 점심이 부실해서 저녁 폭식으로 이어지는 구조인지, 스트레스가 많은 날만 간식이 늘어나는지 보이기 시작합니다. 식단 조절은 완벽함보다 패턴 인식이 먼저입니다. 오늘은 먹은 메뉴보다 먹은 시간을 적는 것부터 시작해도 충분합니다.",
    action_line: "오늘 하루는 식사 시간과 간식 시간만 메모해보세요.",
    raw_text: "식단 기록과 생활 패턴 파악에 대한 기사입니다.",
    published_at: "2026-04-03T12:30:00+09:00"
  },
  {
    slug: "brief-money-pension-apr03",
    title: "연금 안내문은 금액보다 수령 시기부터 다시 보는 편이 좋습니다",
    category: "돈",
    sub_interest: "연금",
    summary_type: "USEFUL",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-money-pension-apr03",
    short_summary: "연금은 예상 수령액만 보는 것보다 언제부터 어떻게 받을 수 있는지 확인해야 계획이 실제와 맞아집니다.",
    long_summary: "연금 관련 안내문을 받으면 대부분 예상 금액부터 보게 됩니다. 하지만 실제 계획에 더 중요한 것은 언제, 어떤 방식으로 받을 수 있는지입니다. 이번 주 생활 재무 기사들을 정리해보면, 수령 가능 시기와 감액 여부, 신청 절차를 미리 이해하는 것이 훨씬 중요하다고 설명합니다. 특히 여러 제도를 함께 보는 경우라면 각각의 시작 시점이 달라 헷갈리기 쉽습니다. 예상 금액은 상황에 따라 달라질 수 있지만, 일정과 조건을 먼저 알아두면 은퇴 이후의 자금 흐름을 더 현실적으로 세울 수 있습니다. 오래 미뤄둘수록 어렵게 느껴지는 정보라서 오늘 한 번만 관련 안내문을 다시 살펴봐도 도움이 됩니다.",
    action_line: "연금 관련 문서에서 수령 가능 시점만 먼저 표시해두세요.",
    raw_text: "연금 수령 시기와 안내문 확인 포인트에 대한 기사입니다.",
    published_at: "2026-04-03T16:10:00+09:00"
  },
  {
    slug: "brief-news-global-apr02",
    title: "국제 이슈는 환율과 유가부터 보면 생활 연결이 쉬워집니다",
    category: "뉴스",
    sub_interest: "국제이슈",
    summary_type: "USEFUL",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-news-global-apr02",
    short_summary: "멀게 느껴지는 국제 뉴스도 환율과 유가처럼 생활비에 닿는 항목부터 보면 이해가 쉬워집니다.",
    long_summary: "국제 뉴스는 중요하지만 생활과 거리가 멀다고 느껴져 금방 넘기기 쉽습니다. 최근 기사들을 보면 에너지 가격, 환율, 원자재 흐름처럼 실제 생활비와 이어지는 포인트를 먼저 보는 방식이 추천됩니다. 국제 정세 변화가 곧바로 외식비나 장보기 가격, 해외 결제 비용에 반영될 수 있기 때문입니다. 모든 뉴스를 자세히 따라가기보다 생활과 연결되는 지표 한두 개를 기준으로 읽는 편이 실용적입니다. 이런 습관이 생기면 국제 뉴스가 더 이상 먼 이야기처럼만 보이지 않습니다. 오늘은 국제 기사 한 건을 읽더라도 환율이나 유가에 어떤 설명이 붙는지 먼저 확인해보면 좋습니다.",
    action_line: "국제 뉴스는 환율과 유가 문장부터 먼저 읽어보세요.",
    raw_text: "국제 뉴스와 생활비 연결 지점을 짚는 기사입니다.",
    published_at: "2026-04-02T08:40:00+09:00"
  },
  {
    slug: "brief-hobby-travel-apr02",
    title: "짧은 여행 준비는 장소보다 동선부터 정리하는 편이 편합니다",
    category: "취미",
    sub_interest: "여행",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-hobby-travel-apr02",
    short_summary: "당일치기나 1박 여행은 가고 싶은 곳을 늘리기보다 이동 동선을 먼저 정리해야 실제 만족도가 높습니다.",
    long_summary: "짧은 여행은 시간은 적고 기대는 커서 오히려 일정이 과해지기 쉽습니다. 이번 주 여행 관련 기사들을 보면, 명소를 많이 넣는 것보다 이동 시간을 줄이는 구성이 더 만족스럽다고 정리합니다. 같은 지역 안에서 도보로 이어지는 장소를 묶거나 식사 장소를 중간에 두는 방식만으로도 체력 소모가 훨씬 적어집니다. 특히 부모님이나 아이와 함께 움직일 때는 이동의 단순함이 가장 중요합니다. 즉흥 여행도 좋지만 이동 순서 하나만 정리해두면 현장에서 결정을 덜 해도 됩니다. 장소보다 동선을 먼저 적어보는 습관이 실제 여행의 피로를 낮춰줍니다.",
    action_line: "가고 싶은 곳보다 이동 순서 세 줄부터 먼저 적어보세요.",
    raw_text: "짧은 여행 계획과 동선 정리에 대한 기사입니다.",
    published_at: "2026-04-02T11:20:00+09:00"
  },
  {
    slug: "brief-family-couple-apr02",
    title: "부부 생활에서는 부탁을 미리 말하는 편이 갈등을 줄입니다",
    category: "가족",
    sub_interest: "부부 생활",
    summary_type: "USEFUL",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-family-couple-apr02",
    short_summary: "생활 속 작은 부탁도 미리 말해두면 서운함이 쌓이는 일을 줄이고 서로의 일정 조정이 쉬워집니다.",
    long_summary: "가족 관계 기사들을 보면, 갈등은 큰 사건보다 표현되지 않은 기대에서 시작되는 경우가 많습니다. 부부 사이에서도 마찬가지입니다. 상대가 알아서 해주길 기대했던 일이 반복되면 서운함이 쌓이기 쉽습니다. 최근 생활형 관계 조언들을 보면, 부탁을 감정이 커진 뒤에 말하기보다 미리 일정 수준에서 공유하는 편이 훨씬 효과적이라고 합니다. 설거지, 장보기, 부모님 연락처럼 작은 생활 항목일수록 말하지 않으면 서로 다르게 인식하기 쉽습니다. 부탁을 미리 말하는 것은 부담을 주는 행동이 아니라 생활을 조율하는 방식에 가깝습니다. 오늘 필요한 한 가지를 먼저 정중하게 말해보는 것만으로도 분위기가 달라질 수 있습니다.",
    action_line: "오늘 꼭 필요한 부탁 한 가지를 미리 말해보세요.",
    raw_text: "부부 생활과 생활 속 의사소통에 대한 기사입니다.",
    published_at: "2026-04-02T19:00:00+09:00"
  },
  {
    slug: "brief-health-mind-apr01",
    title: "마음이 산만할수록 할 일을 세 줄로 줄이는 편이 효과적입니다",
    category: "건강",
    sub_interest: "마음건강",
    summary_type: "USEFUL",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-health-mind-apr01",
    short_summary: "해야 할 일이 많아 머리가 복잡할 때는 우선순위를 세 줄로 줄여 적는 방식이 불안과 피로를 낮추는 데 도움이 됩니다.",
    long_summary: "마음 건강 기사에서는 종종 복잡한 감정을 단순한 행동으로 정리하는 법을 이야기합니다. 최근 보도들을 정리해보면, 해야 할 일을 모두 붙잡고 있기보다 가장 중요한 세 가지만 적어내리는 방식이 실제로 도움 된다는 설명이 많았습니다. 이는 생산성 기술이기보다 마음의 부담을 덜어주는 방법에 가깝습니다. 머릿속에서 계속 맴도는 일을 눈앞에 적어두면 통제감이 생기고, 무엇부터 해야 할지가 선명해집니다. 특히 하루 컨디션이 떨어질수록 거대한 계획보다 작은 실행 목록이 더 현실적입니다. 세 줄 목록은 실패하기 어려운 단위여서 다시 시작하기에도 좋습니다. 일이 밀린 날일수록 더 적게 적는 것이 오히려 마음을 안정시킵니다.",
    action_line: "오늘 해야 할 일은 세 가지까지만 적어보세요.",
    raw_text: "마음 건강과 일상 정리 습관에 대한 기사입니다.",
    published_at: "2026-04-01T07:20:00+09:00"
  },
  {
    slug: "brief-money-housing-apr01",
    title: "부동산 흐름 뉴스는 금리와 전세 물량부터 보는 편이 낫습니다",
    category: "돈",
    sub_interest: "부동산 흐름",
    summary_type: "MUST",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-money-housing-apr01",
    short_summary: "부동산 기사 전체를 다 따라가기보다 금리와 전세 물량 변화부터 보면 실제 체감과 연결이 쉬워집니다.",
    long_summary: "부동산 뉴스는 숫자도 많고 전망도 달라 피로감을 주기 쉽습니다. 최근 기사들을 보면 실수요자에게 가장 직접적인 것은 지역별 거래량보다 금리와 전세 물량 변화라는 설명이 많습니다. 대출 이자 흐름과 전세 매물의 증감은 주거 비용과 이동 계획에 바로 영향을 줍니다. 특히 이사 계획이 아직 멀어 보여도 전세 물량 변화는 시장의 분위기를 읽는 데 도움이 됩니다. 모든 전망을 따라가기보다 내 생활과 연결되는 기준부터 보는 것이 현실적입니다. 뉴스를 적게 봐도 핵심을 놓치지 않는 방식이 중요합니다.",
    action_line: "부동산 뉴스에서는 금리와 전세 물량 문장부터 먼저 보세요.",
    raw_text: "부동산 흐름을 생활비 관점에서 읽는 기사입니다.",
    published_at: "2026-04-01T10:10:00+09:00"
  },
  {
    slug: "brief-news-domestic-apr01",
    title: "국내 이슈는 생활 규칙이 바뀌는 부분부터 읽는 것이 실용적입니다",
    category: "뉴스",
    sub_interest: "국내이슈",
    summary_type: "MUST",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-news-domestic-apr01",
    short_summary: "국내 주요 이슈도 내 생활 방식에 영향을 주는 규칙 변화부터 보면 정보 피로를 줄이면서 핵심을 챙길 수 있습니다.",
    long_summary: "큰 국내 이슈는 하루에도 여러 번 업데이트되기 때문에 전부 따라가기가 어렵습니다. 최근 기사들을 보면, 생활 규칙이나 행정 절차가 바뀌는 부분부터 읽는 것이 훨씬 실용적입니다. 예를 들어 교통 단속, 병원 이용, 공공 서비스 신청 기준이 달라지는 내용은 바로 행동에 영향을 줍니다. 반면 논쟁의 배경을 모두 이해하려고 하면 금방 피로해질 수 있습니다. 뉴스는 많이 아는 것보다 필요한 순간 정확히 아는 편이 더 중요합니다. 국내 이슈를 볼 때도 내 일상에 바로 닿는 조각부터 읽는 습관이 도움이 됩니다.",
    action_line: "국내 뉴스는 생활 규칙 변화가 있는지부터 확인해보세요.",
    raw_text: "국내 이슈를 생활 관점으로 읽는 기사입니다.",
    published_at: "2026-04-01T15:50:00+09:00"
  },
  {
    slug: "brief-hobby-movie-mar31",
    title: "영화 한 편을 정해보는 일만으로 주중 피로가 덜어질 수 있습니다",
    category: "취미",
    sub_interest: "영화",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-hobby-movie-mar31",
    short_summary: "이번 주에 볼 영화 한 편만 미리 정해두어도 무계획하게 시간을 흘려보내는 일을 줄일 수 있습니다.",
    long_summary: "취미가 쉬는 시간에 도움이 되려면 선택 피로를 줄이는 것이 중요합니다. 이번 주 문화 기사들을 정리하면, 영화를 보는 행위 자체보다 무엇을 볼지 미리 정해두는 것이 실제 휴식 만족도를 높인다는 이야기가 많았습니다. 막상 시간이 났을 때 후보가 너무 많으면 아무것도 보지 못한 채 시간을 보내기 쉽기 때문입니다. 영화 한 편을 미리 정해두는 것은 작지만 확실한 휴식 예약처럼 작동합니다. 혼자 보는 경우에도 좋고 가족과 함께 볼 작품을 고를 때도 갈등을 줄일 수 있습니다. 취미는 준비가 쉬울수록 더 자주 이어집니다.",
    action_line: "이번 주에 볼 영화 한 편만 먼저 정해두세요.",
    raw_text: "작은 취미 예약과 영화 선택 피로에 대한 기사입니다.",
    published_at: "2026-03-31T08:00:00+09:00"
  },
  {
    slug: "brief-family-kids-mar31",
    title: "자녀와의 대화는 하루 질문 하나만 있어도 분위기가 달라집니다",
    category: "가족",
    sub_interest: "자녀 소통",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-family-kids-mar31",
    short_summary: "정답을 묻는 대화보다 오늘 어땠는지 묻는 짧은 질문 하나가 자녀와의 대화를 이어가는 데 더 효과적입니다.",
    long_summary: "가족 대화에 관한 기사들은 공통적으로 질문의 방식이 중요하다고 말합니다. 아이에게 숙제했니, 준비물 챙겼니처럼 확인형 질문만 반복되면 대화가 금방 닫히기 쉽습니다. 대신 오늘 제일 웃겼던 일, 친구랑 기억나는 장면 같은 열린 질문은 짧아도 분위기를 바꾸는 힘이 있습니다. 부모 입장에서는 긴 대화를 준비하기 어렵지만, 질문 하나만 바꿔도 응답의 길이가 달라집니다. 자녀 소통은 시간을 많이 쓰는 것보다 압박 없는 시작이 중요합니다. 하루 한 질문만 정해두는 방식이 의외로 지속하기 쉽습니다.",
    action_line: "오늘은 확인보다 이야기형 질문 하나를 먼저 해보세요.",
    raw_text: "자녀와의 생활 대화 습관에 관한 기사입니다.",
    published_at: "2026-03-31T17:30:00+09:00"
  },
  {
    slug: "brief-health-walk-aftermeal-mar31",
    title: "식후 10분 걷기가 몸을 덜 무겁게 만드는 이유",
    category: "건강",
    sub_interest: "걷기",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-health-walk-aftermeal-mar31",
    short_summary: "식사 뒤 바로 눕기보다 10분 정도 걷는 습관은 몸을 덜 답답하게 하고 오후 컨디션을 지키는 데 도움이 됩니다.",
    long_summary: "식후 산책은 오래전부터 권장돼 왔지만 바쁜 일상에서는 자주 생략됩니다. 최근 생활 건강 기사들을 보면, 긴 운동보다 식후 10분 걷기가 더 현실적이고 체감도 높다는 설명이 많습니다. 바로 앉거나 눕는 습관은 속이 더부룩하고 몸이 무거운 느낌을 키우기 쉽습니다. 반면 짧게라도 움직이면 소화 부담을 줄이고 오후 졸림도 덜 느낄 수 있습니다. 점심 후 사무실 복도를 한 바퀴 도는 정도도 충분한 시작이 됩니다. 중요한 것은 매일 반복 가능한 수준으로 만드는 것입니다.",
    action_line: "오늘 점심 후 10분만 천천히 걸어보세요.",
    raw_text: "식후 산책과 몸의 리듬에 관한 기사입니다.",
    published_at: "2026-03-31T13:10:00+09:00"
  },
  {
    slug: "brief-money-saving-mar31",
    title: "생활비를 줄일 때는 큰 결심보다 자동이체 점검이 먼저입니다",
    category: "돈",
    sub_interest: "생활비",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-money-saving-mar31",
    short_summary: "생활비를 줄이고 싶다면 새로운 절약법보다 먼저 매달 빠져나가는 자동이체 항목을 확인하는 편이 효과적입니다.",
    long_summary: "많은 절약 기사들이 소비 습관을 강조하지만, 실제로는 자동 결제 점검이 가장 빠른 출발점인 경우가 많습니다. 스트리밍 서비스, 멤버십, 앱 구독처럼 한 번 등록해두고 잊는 비용은 체감이 낮아 오래 유지되기 쉽습니다. 최근 재무 기사들을 보면, 자동이체 목록만 한 번 훑어봐도 불필요한 지출이 꽤 보인다고 설명합니다. 절약은 의지를 오래 끌어쓰는 일보다 눈에 보이는 구조를 먼저 손보는 것이 더 쉽습니다. 오늘 10분만 써도 매달 반복되는 지출을 줄일 수 있습니다.",
    action_line: "이번 달 자동이체 목록부터 한 번 점검해보세요.",
    raw_text: "생활비 절약의 첫 단계로 자동이체 점검을 제안하는 기사입니다.",
    published_at: "2026-03-31T20:20:00+09:00"
  },
  {
    slug: "brief-news-policy-support-apr05",
    title: "지역 지원사업은 공고 제목보다 제출 서류부터 확인하는 편이 낫습니다",
    category: "뉴스",
    sub_interest: "정책 변화",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-news-policy-support-apr05",
    short_summary: "지원사업 공고는 혜택 설명보다 제출 서류와 신청 방식부터 보는 편이 실제 준비에 더 도움이 됩니다.",
    long_summary: "지원사업 공고는 보기에는 쉬워도 막상 신청 단계에서 준비물 때문에 멈추는 경우가 많습니다. 이번 주 여러 생활 지원 기사들을 정리해보면, 제출 서류와 신청 채널을 미리 확인한 사람이 실제 신청까지 이어질 가능성이 높았습니다. 혜택이 좋아 보여도 서류 준비 시간이 길면 일정을 따로 잡아야 하기 때문입니다. 공고를 저장만 해두고 잊는 일이 많다면, 읽는 순간 준비물부터 표시해두는 방식이 효과적입니다. 생활형 정책 정보는 많이 아는 것보다 마감 전에 실제 행동으로 옮기는 것이 더 중요합니다.",
    action_line: "지원 공고를 보면 제출 서류부터 먼저 적어두세요.",
    raw_text: "지원사업 공고 읽기 순서를 다룬 기사입니다.",
    published_at: "2026-04-05T14:30:00+09:00"
  },
  {
    slug: "brief-hobby-reading-space-apr06",
    title: "독서 자리를 고정하면 책 읽는 시간이 훨씬 쉽게 붙습니다",
    category: "취미",
    sub_interest: "책",
    summary_type: "ACTION",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-hobby-reading-space-apr06",
    short_summary: "독서를 습관으로 만들고 싶다면 시간보다 자리를 먼저 고정하는 편이 실천에 도움이 됩니다.",
    long_summary: "습관 관련 기사에서는 행동을 쉽게 만드는 환경의 힘을 자주 강조합니다. 독서도 마찬가지입니다. 책을 읽을 시간을 비워두는 일보다, 읽는 자리를 먼저 정해두는 편이 실천 가능성이 더 높습니다. 소파 한쪽, 식탁 끝, 침대 옆 조명 아래처럼 늘 같은 장소가 있으면 몸이 더 쉽게 그 행동으로 넘어갑니다. 이번 주 독서 습관 관련 보도들도 이런 환경 설계를 반복해서 이야기했습니다. 읽는 시간이 들쭉날쭉한 사람일수록 장소 고정이 도움이 됩니다. 오늘부터는 읽을 책과 안경, 메모를 한 자리에 놓아두는 것만으로도 시작이 쉬워질 수 있습니다.",
    action_line: "책 읽는 자리를 한 곳으로 정해두세요.",
    raw_text: "독서 습관을 위한 환경 설계에 대한 기사입니다.",
    published_at: "2026-04-06T18:20:00+09:00"
  },
  {
    slug: "brief-family-home-routine-apr04",
    title: "집안일은 분담표보다 마감 시간 합의가 더 중요합니다",
    category: "가족",
    sub_interest: "집안 일정",
    summary_type: "MUST",
    source_name: "세줄아침 편집팀",
    source_url: "https://sejulachim.studiobyyou.kr/archive/brief-family-home-routine-apr04",
    short_summary: "집안일을 누가 맡는지보다 언제까지 끝내기로 할지 먼저 정하면 갈등을 줄이기 쉽습니다.",
    long_summary: "가사 분담은 항목만 나누는 방식으로는 자주 어긋납니다. 이번 주 가족 생활 기사들을 보면, 누가 할지보다 언제까지 끝낼지에 대한 기준이 먼저 있어야 충돌이 줄어든다고 설명합니다. 예를 들어 설거지는 저녁 9시 전, 빨래는 토요일 오전까지처럼 시간 기준을 합의하면 중간에 기대가 어긋나는 일이 줄어듭니다. 분담표는 보기엔 깔끔하지만 실행은 생활 리듬과 연결되어야 합니다. 가족 간 마찰은 게으름보다 서로 다른 타이밍 감각에서 나오는 경우가 많습니다. 마감 시간을 먼저 맞추는 것이 생각보다 큰 차이를 만듭니다.",
    action_line: "집안일 한 가지는 마감 시간부터 먼저 합의해보세요.",
    raw_text: "가족 가사 분담과 시간 기준 합의에 대한 기사입니다.",
    published_at: "2026-04-04T20:00:00+09:00"
  }
];

function mapRow(item) {
  return {
    id: randomUUID(),
    title: item.title,
    category: item.category,
    sub_interest: item.sub_interest,
    source_name: item.source_name,
    source_url: item.source_url,
    sources: [{ name: item.source_name, url: item.source_url, type: "news" }],
    raw_text: item.raw_text,
    short_summary: item.short_summary,
    long_summary: item.long_summary,
    action_line: item.action_line,
    summary_type: item.summary_type,
    approval_status: "approved",
    ai_status: "completed",
    summary_status: "done",
    published_at: item.published_at,
    slug: item.slug,
    thumbnail_url: imageUrl,
    thumbnail_alt: item.title,
    thumbnail_page_url: item.source_url,
    thumbnail_license: null,
    created_at: item.published_at,
    updated_at: item.published_at
  };
}

async function seedSettings() {
  const now = new Date().toISOString();
  const settingsRows = [
    {
      key: "home_hero_section",
      title: "오늘 필요한 소식만, 가볍게",
      subtitle: "세줄아침은 지난 7일 동안 놓치기 쉬운 생활 뉴스와 건강, 돈, 취미, 가족 소식을 읽기 쉬운 분량으로 정리해드립니다.",
      use_image: true,
      image_url: "/sejulachim-seo.jpg",
      image_alt: "세줄아침 메인 이미지",
      updated_at: now
    },
    {
      key: "home_today_section",
      section_title: "오늘의 소식",
      section_description: "최근 일주일 기준으로 분야별로 바로 읽기 좋은 소식을 세 개씩 골랐습니다.",
      image_url: "/sejulachim-seo.jpg",
      image_alt: "오늘의 소식 대표 이미지",
      image_title: "생활에 바로 닿는 세 가지",
      image_description: "건강, 돈, 뉴스, 취미, 가족에서 바로 읽을 만한 핵심 소식만 추렸습니다.",
      updated_at: now
    }
  ];

  const { error } = await supabase.from('sj_site_settings').upsert(settingsRows, { onConflict: "key" });
  if (error) throw error;
}

async function seedContent() {
  const rows = items.map(mapRow);
  const { error } = await supabase.from('sj_content_items').upsert(rows, { onConflict: "slug" });
  if (error) throw error;

  const latestByType = {
    MUST: rows.filter((row) => row.summary_type === "MUST").sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0],
    USEFUL: rows.filter((row) => row.summary_type === "USEFUL").sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0],
    ACTION: rows.filter((row) => row.summary_type === "ACTION").sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0]
  };

  const pickDate = "2026-04-06";
  const { data: dailyPick, error: dailyPickError } = await supabase
    .from('sj_daily_picks')
    .upsert(
      {
        pick_date: pickDate,
        generated_at: "2026-04-06T07:00:00+09:00",
        status: "ready"
      },
      { onConflict: "pick_date" }
    )
    .select("id")
    .single();

  if (dailyPickError) throw dailyPickError;

  const { error: pickDeleteError } = await supabase.from('sj_daily_pick_items').delete().eq("daily_pick_id", dailyPick.id);
  if (pickDeleteError) throw pickDeleteError;

  const { error: dailyPickItemsError } = await supabase.from('sj_daily_pick_items').insert([
    { daily_pick_id: dailyPick.id, content_item_id: latestByType.MUST.id, position: 1 },
    { daily_pick_id: dailyPick.id, content_item_id: latestByType.USEFUL.id, position: 2 },
    { daily_pick_id: dailyPick.id, content_item_id: latestByType.ACTION.id, position: 3 }
  ]);

  if (dailyPickItemsError) throw dailyPickItemsError;
}

async function main() {
  await seedSettings();
  await seedContent();

  const { count } = await supabase.from('sj_content_items').select("*", { count: "exact", head: true });
  console.log(JSON.stringify({ ok: true, contentCount: count ?? 0, seededDays: 7 }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
