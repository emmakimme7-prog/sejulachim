export const MAIN_INTERESTS = ["건강", "돈", "실생활", "뉴스", "관계"] as const;
export type MainInterest = (typeof MAIN_INTERESTS)[number];

export const SUB_INTERESTS: Record<MainInterest, string[]> = {
  건강: ["혈압", "관절", "음식", "상식", "병원"],
  돈: ["연금", "세금", "보험", "주의", "혜택"],
  실생활: ["꿀팁", "가전", "청소", "요리", "교통"],
  뉴스: ["주요 뉴스", "경제", "정책", "사회", "해외"],
  관계: ["가족", "부부", "회사", "취미", "친구"]
};

const DISPLAY_MAIN_INTEREST_BY_STORED_CATEGORY: Record<string, MainInterest> = {
  건강: "건강",
  돈: "돈",
  실생활: "실생활",
  뉴스: "뉴스",
  관계: "관계",
  취미: "실생활",
  가족: "관계"
};

const STORED_CATEGORY_BY_MAIN_INTEREST: Record<MainInterest, string> = {
  건강: "건강",
  돈: "돈",
  실생활: "실생활",
  뉴스: "뉴스",
  관계: "관계"
};

const MAIN_INTEREST_BY_SUB_INTEREST = Object.fromEntries(
  Object.entries(SUB_INTERESTS).flatMap(([mainInterest, subInterests]) =>
    subInterests.map((subInterest) => [subInterest, mainInterest as MainInterest])
  )
) as Record<string, MainInterest>;

export function getDisplayMainInterest(category?: string | null, subInterest?: string | null) {
  if (subInterest && MAIN_INTEREST_BY_SUB_INTEREST[subInterest]) {
    return MAIN_INTEREST_BY_SUB_INTEREST[subInterest];
  }

  if (category && DISPLAY_MAIN_INTEREST_BY_STORED_CATEGORY[category]) {
    return DISPLAY_MAIN_INTEREST_BY_STORED_CATEGORY[category];
  }

  return (category as MainInterest | undefined) ?? "뉴스";
}

export function getStoredCategoryForMainInterest(mainInterest?: string | null) {
  if (!mainInterest || !(mainInterest in STORED_CATEGORY_BY_MAIN_INTEREST)) {
    return mainInterest ?? "뉴스";
  }

  return STORED_CATEGORY_BY_MAIN_INTEREST[mainInterest as MainInterest];
}
