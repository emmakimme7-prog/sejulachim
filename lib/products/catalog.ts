export type ProductCatalogItem = {
  id: string;
  title: string;
  category: string;
  subInterest?: string | null;
  description: string;
  reason: string;
  searchKeyword: string;
  searchKeywords?: string[];
  badge: string;
  linkUrl: string;
};

export type ResolvedAffiliateProduct = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  imageUrl: string | null;
  linkUrl: string;
  sourceKeyword: string;
};

type ContentProductMatchInput = {
  category?: string | null;
  subInterest?: string | null;
  title?: string | null;
  shortSummary?: string | null;
  actionLine?: string | null;
  longSummary?: string | null;
  rawText?: string | null;
};

export const PRODUCT_DISCLOSURE =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

function createCoupangSearchUrl(keyword: string) {
  return `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword)}`;
}

function defineProduct(
  id: string,
  category: string,
  subInterest: string | null,
  title: string,
  searchKeyword: string,
  description: string,
  reason: string,
  badge: string,
  searchKeywords?: string[]
): ProductCatalogItem {
  return {
    id,
    title,
    category,
    subInterest,
    description,
    reason,
    searchKeyword,
    searchKeywords,
    badge,
    linkUrl: createCoupangSearchUrl(searchKeyword)
  };
}

export const PRODUCT_CATALOG: ProductCatalogItem[] = [
  defineProduct("health-bp-monitor", "건강", "혈압", "가정용 자동 혈압계", "혈압 측정 스마트워치", "집에서 아침 혈압을 짧게 기록하기 좋은 기본 건강 측정기입니다.", "혈압 관련 콘텐츠와 함께 두면 바로 실천으로 이어지기 쉽습니다.", "건강 점검", ["오므론 혈압계"]),
  defineProduct("health-knee-support", "건강", "관절", "무릎 보호대", "무릎 보호대 운동용", "가벼운 산책이나 실내 활동 시 무릎 부담을 덜어주는 보조용품입니다.", "관절 관리 글과 연결했을 때 전환 의도가 분명한 편입니다.", "관절 케어", ["무릎 보호대", "무릎아대"]),
  defineProduct("health-lunchbox", "건강", "음식", "소분 밀폐 도시락통", "소분 밀폐 도시락통", "식단 기록이나 분량 조절에 도움을 주는 생활형 식사 준비 아이템입니다.", "음식 카테고리 글에서 바로 연상되는 실용 상품입니다.", "식단 관리", ["밀폐 도시락통", "스텐 도시락통", "밀프랩 도시락통"]),
  defineProduct("health-medical-book", "건강", "상식", "시니어 건강 상식 도서", "시니어 건강 상식 책", "병원 방문 전후나 건강 루틴 정리에 참고하기 좋은 기본 상식 도서입니다.", "정보형 콘텐츠와의 결이 잘 맞는 안전한 추천군입니다.", "생활 상식"),
  defineProduct("health-pill-case", "건강", "병원", "주간 약 보관함", "주간 약 보관함", "복약 시간과 복용량을 나눠 챙기기 편한 정리형 아이템입니다.", "병원·복약 관련 실생활 문제와 바로 맞닿아 있습니다.", "복약 관리"),
  defineProduct("money-pension-file", "돈", "연금", "중요 서류 아코디언 파일", "서류 정리 파일 아코디언", "연금과 공공 서류를 한곳에 모아두기 좋은 분류형 파일입니다.", "연금 정보는 준비 서류 관리와 연결할 때 실용성이 높습니다.", "서류 정리"),
  defineProduct("money-receipt-scanner", "돈", "세금", "휴대용 문서 스캐너", "휴대용 문서 스캐너", "영수증과 증빙서류를 빠르게 디지털화하기 좋은 정리 도구입니다.", "세금·절세 관련 글 하단에 자연스럽게 붙일 수 있습니다.", "절세 준비"),
  defineProduct("money-doc-box", "돈", "보험", "방수 문서 보관함", "문서 보관함 방수", "보험 증권과 계약 서류를 안전하게 모아두기 좋은 정리함입니다.", "보험은 정보 소비 뒤 정리 행동으로 이어지는 경우가 많습니다.", "보험 정리"),
  defineProduct("money-fraud-blocker", "돈", "주의", "보이스피싱 차단 전화기", "보이스피싱 차단 전화기", "스팸·사기 전화 대응을 돕는 고령층 친화형 전화기입니다.", "주의 카테고리와 전환 맥락이 가장 직접적으로 연결됩니다.", "주의 상품"),
  defineProduct("money-shredder", "돈", "혜택", "개인정보 문서세단기", "문서 세단기 개인정보", "지원 서류나 고지서를 처리할 때 개인정보 노출을 줄여주는 실용 정리 제품입니다.", "혜택·신청 관련 글과 함께 두기 좋은 분명한 실물 상품입니다.", "문서 보안"),
  defineProduct("life-storage-cart", "실생활", "꿀팁", "이동식 틈새 수납장", "이동식 틈새 수납장", "자주 쓰는 생활용품을 한곳에 모아두기 쉬운 정리형 아이템입니다.", "생활 꿀팁 콘텐츠와 가장 자연스럽게 연결되는 상품군입니다.", "생활 정리"),
  defineProduct("life-air-fryer-paper", "실생활", "가전", "에어프라이어 종이호일", "에어프라이어 종이호일", "요리와 청소 부담을 함께 줄여주는 가전 보조 소모품입니다.", "가전 관련 글에서 클릭 동기를 만들기 쉬운 저관여 상품입니다.", "가전 소모품"),
  defineProduct("life-cleaning-wipes", "실생활", "청소", "대용량 청소포", "대용량 청소포", "바닥과 가구 먼지를 빠르게 닦아내기 좋은 소모품입니다.", "청소 콘텐츠와 즉시 구매 니즈가 잘 맞습니다.", "청소 소모품"),
  defineProduct("life-pan-set", "실생활", "요리", "논스틱 프라이팬 세트", "논스틱 프라이팬 세트", "가볍고 관리가 쉬운 기본 조리도구 구성입니다.", "요리 관련 글에서 체감 가치가 분명한 대표 상품입니다.", "주방 기본템"),
  defineProduct("life-cushion", "실생활", "교통", "차량용 허리 쿠션", "차량용 허리 쿠션", "운전이나 장시간 이동 시 허리 부담을 덜어주는 보조용품입니다.", "교통·이동 콘텐츠에서 실용성이 높은 제품입니다.", "이동 편의"),
  defineProduct("news-radio", "뉴스", "주요 뉴스", "휴대용 효도 라디오", "휴대용 라디오", "아침 뉴스와 생활 정보를 간단히 듣기 좋은 소형 라디오입니다.", "뉴스 콘텐츠 소비 맥락과 자연스럽게 이어집니다.", "아침 정보"),
  defineProduct("news-ledger", "뉴스", "경제", "휴대용 환율 계산기", "휴대용 전자 계산기", "환율이나 생활비 계산을 빠르게 확인할 때 쓰기 좋은 기본 계산기입니다.", "경제 뉴스와 숫자 확인 행동을 바로 연결할 수 있습니다.", "경제 확인"),
  defineProduct("news-document-tray", "뉴스", "정책", "문서보관 아코디언 파일", "아코디언 파일 서류정리", "정책 안내문, 고지서, 신청 서류를 분류해 두기 좋은 정리용품입니다.", "정책 변화 글은 실제 신청 행동과 연결될 때 효과가 좋습니다.", "정책 대응"),
  defineProduct("news-safety-light", "뉴스", "사회", "휴대용 안전 경보기", "휴대용 안전 경보기", "외출 시 가방이나 열쇠고리에 걸어두는 안전용품입니다.", "사회·생활 안전 이슈와 함께 소개하기 적합합니다.", "생활 안전"),
  defineProduct("news-travel-adapter", "뉴스", "해외", "해외 멀티 어댑터", "해외 멀티 어댑터", "해외 소식이나 여행 준비 글과 함께 보여주기 좋은 기본 준비물입니다.", "해외 관련 콘텐츠에서 연관성을 만들기 쉽습니다.", "해외 준비"),
  defineProduct("relation-calendar", "관계", "가족", "가족 일정 보드", "가족 일정 보드", "집에서 같이 보는 일정판으로 가족 약속과 할 일을 정리하기 좋습니다.", "가족 커뮤니케이션과 일정 관리 글에 자연스럽게 맞습니다.", "가족 루틴"),
  defineProduct("relation-couple-note", "관계", "부부", "대화 질문 카드", "부부 대화 질문 카드", "짧은 대화를 시작하기 좋은 질문형 카드 세트입니다.", "부부 관계 콘텐츠와 함께 배치했을 때 감정적 연결이 좋습니다.", "관계 대화"),
  defineProduct("relation-desk-pad", "관계", "회사", "데스크 메모 패드", "데스크 메모 패드", "업무 전달사항과 우선순위를 빠르게 적기 좋은 책상용 메모 도구입니다.", "회사 관계나 소통 팁 콘텐츠와 궁합이 좋습니다.", "업무 소통"),
  defineProduct("relation-hobby-kit", "관계", "취미", "컬러링북 세트", "컬러링북 세트 성인", "혼자 혹은 함께 가볍게 즐길 수 있는 저부담 취미 아이템입니다.", "취미 카테고리 콘텐츠와 연결되는 대표 상품군입니다.", "취미 시작"),
  defineProduct("relation-picnic-mat", "관계", "친구", "2인용 피크닉 매트", "2인용 피크닉 매트", "가벼운 나들이나 모임 때 부담 없이 꺼내기 좋은 야외용품입니다.", "친구·모임 콘텐츠 하단에서 연관성을 만들기 쉽습니다.", "가벼운 모임")
];

export function getProductCategories() {
  return Array.from(new Set(PRODUCT_CATALOG.map((item) => item.category)));
}

export function listProductsByCategory(category?: string | null) {
  if (!category?.trim()) {
    return PRODUCT_CATALOG;
  }

  return PRODUCT_CATALOG.filter((item) => item.category === category.trim());
}

export function listProductsForContent(category?: string | null, subInterest?: string | null, limit = 3) {
  const normalizedCategory = category?.trim() ?? "";
  const normalizedSubInterest = subInterest?.trim() ?? "";
  const exactMatches = PRODUCT_CATALOG.filter(
    (item) => item.category === normalizedCategory && item.subInterest === normalizedSubInterest
  );
  const categoryMatches = PRODUCT_CATALOG.filter(
    (item) => item.category === normalizedCategory && item.subInterest !== normalizedSubInterest
  );

  return [...exactMatches, ...categoryMatches].slice(0, limit);
}

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}

function tokenize(value: string | null | undefined) {
  return normalizeText(value)
    .split(/[^0-9a-zA-Z가-힣]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function matchProductsToContent(input: ContentProductMatchInput, limit = 3) {
  const normalizedCategory = input.category?.trim() ?? "";
  const normalizedSubInterest = input.subInterest?.trim() ?? "";
  const haystack = [
    input.title,
    input.shortSummary,
    input.actionLine,
    input.longSummary,
    input.rawText
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ");

  const scored = PRODUCT_CATALOG.map((product) => {
    let score = 0;

    if (product.category === normalizedCategory) {
      score += 12;
    }
    if (product.subInterest && product.subInterest === normalizedSubInterest) {
      score += 18;
    }

    const keywords = [
      product.title,
      product.searchKeyword,
      ...(product.searchKeywords ?? []),
      product.subInterest,
      ...tokenize(product.description)
    ]
      .flatMap((value) => tokenize(value))
      .filter(Boolean);

    const keywordMatches = new Set<string>();
    for (const keyword of keywords) {
      if (haystack.includes(keyword)) {
        keywordMatches.add(keyword);
      }
    }

    score += keywordMatches.size * 5;

    return { product, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const matched = scored.map((entry) => entry.product);
  const fallbackByCategory = PRODUCT_CATALOG.filter(
    (product) =>
      product.category === normalizedCategory &&
      !matched.some((matchedProduct) => matchedProduct.id === product.id)
  );
  const fallbackGlobal = PRODUCT_CATALOG.filter(
    (product) =>
      !matched.some((matchedProduct) => matchedProduct.id === product.id) &&
      !fallbackByCategory.some((fallbackProduct) => fallbackProduct.id === product.id)
  );

  return [...matched, ...fallbackByCategory, ...fallbackGlobal].slice(0, limit);
}

export function listFallbackProducts(category?: string | null, excludeIds: string[] = [], limit = 12) {
  const normalizedCategory = category?.trim() ?? "";
  const excluded = new Set(excludeIds);
  const categoryProducts = PRODUCT_CATALOG.filter(
    (product) => product.category === normalizedCategory && !excluded.has(product.id)
  );
  const otherProducts = PRODUCT_CATALOG.filter(
    (product) => product.category !== normalizedCategory && !excluded.has(product.id)
  );

  return [...categoryProducts, ...otherProducts].slice(0, limit);
}
