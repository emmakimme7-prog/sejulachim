import type { ReactNode } from "react";
import Link from "next/link";

import { ContentThumbnail } from "@/components/content-thumbnail";
import { formatDate } from "@/lib/utils";

/**
 * 피드 / 상세 "다음 글" / 마이페이지 서재가 공유하는 단일 아티클 카드.
 *
 * 핵심 구조·본문 분리·시각 토큰을 여기서 한 번만 정의해 세 곳이 갈라지지 않게 한다.
 * 컨텍스트별 기능(피드 체크박스·듣기/공유/저장, 서재 저장 버튼 등)은 leading/footer로 주입.
 */

export const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF" },
};

const FALLBACK_META = { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };

export function getCategoryMeta(cat: string | null | undefined) {
  if (!cat) return FALLBACK_META;
  return CATEGORY_META[cat] ?? FALLBACK_META;
}

export function CategoryBadge({
  category,
  interestLabels,
  subInterest,
}: {
  category: string;
  interestLabels?: Record<string, string>;
  subInterest?: string | null;
}) {
  const meta = getCategoryMeta(category);
  const label = interestLabels?.[category] ?? category;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 999,
        background: meta.bg,
        color: meta.color,
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: "-0.01em",
      }}
    >
      <span style={{ fontSize: 15 }}>{meta.emoji}</span>
      {label}
      {subInterest ? ` · ${subInterest}` : ""}
    </span>
  );
}

export function CategoryPlaceholder({
  cat,
  size = 96,
  rounded = 14,
  aspect = false,
}: {
  cat: string | null | undefined;
  size?: number;
  rounded?: number;
  aspect?: boolean;
}) {
  const m = getCategoryMeta(cat);
  const stripe = `repeating-linear-gradient(135deg, ${m.color}14 0 8px, transparent 8px 16px)`;
  return (
    <div
      style={{
        width: aspect ? "100%" : size,
        height: aspect ? undefined : size,
        aspectRatio: aspect ? "1 / 1" : undefined,
        borderRadius: rounded,
        background: m.bg,
        backgroundImage: stripe,
        border: `1px solid ${m.color}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: Math.round(size * 0.44),
      }}
      aria-hidden="true"
    >
      {m.emoji}
    </div>
  );
}

export type ArticleCardItem = {
  title: string;
  short_summary: string;
  action_line?: string | null;
  slug: string;
  published_at?: string | null;
  /** 표시용 카테고리(메인 관심사). feed의 main_interest / detail·library의 category */
  category: string;
  sub_interest?: string | null;
  thumbnail_url?: string | null;
  thumbnail_alt?: string | null;
};

const bodyStyle = {
  margin: 0,
  fontSize: "calc(15px * var(--font-scale, 1))",
  lineHeight: 1.6,
  color: "#4A4037",
  fontWeight: 500,
} as const;

export function ArticleCard({
  item,
  interestLabels,
  leading,
  footer,
  trackArchiveItem = false,
}: {
  item: ArticleCardItem;
  interestLabels?: Record<string, string>;
  /** 상단 행에 배지 앞으로 들어가는 노드 (예: 피드/서재 선택 체크박스). Link 밖. */
  leading?: ReactNode;
  /** 카드 하단 액션 바 (예: 듣기/공유/저장). Link 밖. */
  footer?: ReactNode;
  /** 피드 자동재생 스크롤 인덱싱용 data-archive-item 부착 */
  trackArchiveItem?: boolean;
}) {
  return (
    <article
      {...(trackArchiveItem ? { "data-archive-item": true } : {})}
      style={{
        background: "#fff",
        borderRadius: 20,
        border: "1.5px solid #F2E6D7",
        padding: 18,
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      {/* 상단: (체크박스) + 카테고리 배지 + 날짜 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        {leading}
        <CategoryBadge category={item.category} interestLabels={interestLabels} subInterest={item.sub_interest} />
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#9C907F", fontWeight: 600 }}>
          {item.published_at ? formatDate(item.published_at) : "발행 전"}
        </span>
      </div>

      <Link
        href={`/archive/${item.slug}`}
        className="group block"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: "calc(20px * var(--font-scale, 1))",
                fontWeight: 900,
                color: "#1F1A14",
                letterSpacing: "-0.03em",
                lineHeight: 1.35,
                marginBottom: 10,
              }}
            >
              {item.title}
            </h2>
            {/* 데스크톱: 본문이 제목 아래(썸네일 옆). 모바일은 행 아래로 분리 — 별도 <p> */}
            <p className="hidden sm:block" style={bodyStyle}>
              {item.short_summary}
            </p>
          </div>
          {item.thumbnail_url ? (
            <ContentThumbnail
              src={item.thumbnail_url}
              alt={item.thumbnail_alt?.trim() || item.title}
              fallbackAlt={item.title}
              className="w-24 h-24 shrink-0 overflow-hidden rounded-xl md:w-28 md:h-28"
              imgClassName="w-full h-full object-cover"
              fallbackLabel="준비 중"
            />
          ) : (
            <CategoryPlaceholder cat={item.category} size={96} />
          )}
        </div>
        {/* 모바일 전용: 본문을 제목+썸네일 행과 분리해 풀폭으로 */}
        <p className="sm:hidden" style={{ ...bodyStyle, margin: "12px 0 0" }}>
          {item.short_summary}
        </p>
        {item.action_line ? (
          <div
            style={{
              display: "block",
              padding: "10px 14px",
              borderRadius: 12,
              background: "#FFF2E3",
              fontSize: "calc(14px * var(--font-scale, 1))",
              fontWeight: 800,
              color: "#B2570F",
              letterSpacing: "-0.01em",
              marginTop: 12,
            }}
          >
            ✓ {item.action_line}
          </div>
        ) : null}
      </Link>

      {footer}
    </article>
  );
}
