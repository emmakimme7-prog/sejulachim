"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF" },
};

export function FeedCategorySidebar({
  categories,
  interestLabels,
}: {
  categories: string[];
  interestLabels: Record<string, string>;
}) {
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";
  const view = searchParams.get("view") ?? "";
  // 오늘 소식 / 지난 소식 탭에서 카테고리를 눌러도 현재 탭 유지.
  const viewSuffix = view ? `&view=${encodeURIComponent(view)}` : "";
  const allHref = view ? `/?view=${encodeURIComponent(view)}` : "/";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1.5px solid #F2E6D7",
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#7A6F62",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          padding: "4px 10px 10px",
        }}
      >
        카테고리
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <Link
          href={allHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 12px",
            borderRadius: 10,
            background: !current ? "#1F1A14" : "transparent",
            color: !current ? "#fff" : "#2A241D",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: !current ? 900 : 700,
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: 18 }} aria-hidden="true">📚</span>
          전체
        </Link>
        {categories.map((cat) => {
          const on = current === cat;
          const m = CATEGORY_META[cat] ?? { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };
          return (
            <Link
              key={cat}
              href={`/?category=${encodeURIComponent(cat)}${viewSuffix}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 12px",
                borderRadius: 10,
                background: on ? "#1F1A14" : "transparent",
                color: on ? "#fff" : "#2A241D",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 15,
                fontWeight: on ? 900 : 700,
                letterSpacing: "-0.01em",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 18 }} aria-hidden="true">{m.emoji}</span>
              {interestLabels[cat] ?? cat}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
