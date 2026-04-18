export const SENIOR_COLORS = {
  bgMain: "#FFFBF5",
  bgFrame: "#F0EEE9",
  orange: "#E57C23",
  orangeDark: "#B2570F",
  orangeLight: "#FFF2E3",
  orangeBorder: "#FFD1A3",
  ink: "#1F1A14",
  inkSub: "#4A4037",
  grey: "#7A6F62",
  greyFaint: "#9C907F",
  border: "#E8DCC7",
  borderSoft: "#F2E6D7",
  divider: "#F5EEE2",
} as const;

export type CategoryKey = "건강" | "돈" | "실생활" | "뉴스" | "관계";

export const CATEGORY_META: Record<CategoryKey, { emoji: string; color: string; bg: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF" },
};

export type SizeKey = "small" | "medium" | "large";
export const SCALE_MAP: Record<SizeKey, number> = { small: 0.85, medium: 1.0, large: 1.28 };

export const FONT_OPTIONS: { key: SizeKey; label: string; shortLabel: string; size: number }[] = [
  { key: "small", label: "작게", shortLabel: "가", size: 14 },
  { key: "medium", label: "보통", shortLabel: "가", size: 18 },
  { key: "large", label: "크게", shortLabel: "가", size: 22 },
];
