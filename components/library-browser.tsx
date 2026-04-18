"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { CompleteShareButton } from "@/components/complete-share-button";
import { ContentThumbnail } from "@/components/content-thumbnail";
function CategoryPlaceholder({ cat, size = 96 }: { cat: string; size?: number }) {
  const m = CATEGORY_META[cat] ?? { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };
  const stripe = `repeating-linear-gradient(135deg, ${m.color}14 0 8px, transparent 8px 16px)`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
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
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { ListenButton } from "@/components/speech-controls";
import { type ContentSource } from "@/lib/content/sources";
import { formatDate } from "@/lib/utils";

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF" },
};

function CategoryBadge({ category, interestLabels, subInterest }: { category: string; interestLabels: Record<string, string>; subInterest?: string | null }) {
  const meta = CATEGORY_META[category] ?? { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };
  const label = interestLabels[category] ?? category;
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

type FavoriteItem = {
  id: string;
  slug: string;
  title: string;
  short_summary: string;
  action_line?: string | null;
  sources?: ContentSource[];
  published_at: string | null;
  category: string;
  sub_interest?: string | null;
  thumbnail_url?: string | null;
};

type SharedItem = {
  share_key: string;
  created_at: string;
  view_count: number;
  comment_count: number;
  items: Array<{
    title: string;
    category: string;
    sub_interest?: string | null;
  }>;
};

export function LibraryBrowser({
  favorites,
  shares,
  interestLabels,
}: {
  favorites: FavoriteItem[];
  shares: SharedItem[];
  interestLabels: Record<string, string>;
}) {
  const [activeTab, setActiveTab] = useState<"favorites" | "shares">("favorites");
  const [selectedInterest, setSelectedInterest] = useState("전체");
  const [query, setQuery] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  function toggleSlug(slug: string) {
    setSelectedSlugs((current) => (current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]));
  }

  const favoriteInterests = useMemo(
    () => ["전체", ...Array.from(new Set(favorites.map((item) => item.category).filter(Boolean)))],
    [favorites]
  );

  const filteredFavorites = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return favorites.filter((item) => {
      const matchesInterest = selectedInterest === "전체" || item.category === selectedInterest;
      const haystack = [item.title, item.short_summary, item.category, item.sub_interest].filter(Boolean).join(" ").toLowerCase();
      return matchesInterest && (needle.length === 0 || haystack.includes(needle));
    });
  }, [favorites, query, selectedInterest]);

  const selectedTitles = filteredFavorites
    .filter((item) => selectedSlugs.includes(item.slug))
    .map((item) => item.title)
    .join(", ");

  const selectedListenText = filteredFavorites
    .filter((item) => selectedSlugs.includes(item.slug))
    .map((item) => [item.title, item.short_summary].filter(Boolean).join(". "))
    .join(". ");

  const filteredShares = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shares.filter((record) => {
      if (selectedInterest !== "전체" && !record.items.some((item) => item.category === selectedInterest)) {
        return false;
      }
      const haystack = record.items
        .flatMap((item) => [item.title, item.category, item.sub_interest])
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return needle.length === 0 || haystack.includes(needle);
    });
  }, [query, selectedInterest, shares]);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(
          [
            { key: "favorites", label: "저장한 소식" },
            { key: "shares", label: "공유한 소식" },
          ] as const
        ).map((tab) => {
          const on = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: "0 0 auto",
                minHeight: 48,
                padding: "0 20px",
                borderRadius: 12,
                background: on ? "#1F1A14" : "#fff",
                color: on ? "#fff" : "#4A4037",
                border: on ? "none" : "1.5px solid #E8DCC7",
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 필터 + 검색 */}
      <div
        style={{
          background: "#fff",
          border: "1.5px solid #F2E6D7",
          borderRadius: 14,
          padding: "10px 12px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            flex: 1,
            minWidth: 0,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {favoriteInterests.map((interest) => {
            const on = selectedInterest === interest;
            const meta = interest !== "전체" ? CATEGORY_META[interest] : null;
            return (
              <button
                key={interest}
                type="button"
                onClick={() => setSelectedInterest(interest)}
                style={{
                  flexShrink: 0,
                  minHeight: 36,
                  padding: "0 14px",
                  borderRadius: 999,
                  background: on ? "#E57C23" : "#fff",
                  color: on ? "#fff" : "#4A4037",
                  border: on ? "none" : "1.5px solid #E8DCC7",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {meta ? <span>{meta.emoji}</span> : null}
                {interest === "전체" ? "전체" : interestLabels[interest] ?? interest}
              </button>
            );
          })}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setQuery(query.trim());
          }}
          placeholder="검색"
          style={{
            height: 36,
            minWidth: 120,
            padding: "0 12px",
            borderRadius: 10,
            border: "1.5px solid #E8DCC7",
            background: "#FFFBF5",
            fontSize: 13,
            color: "#1F1A14",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
      </div>

      {/* 선택 액션 바 */}
      {selectedSlugs.length > 0 ? (
        <div
          style={{
            position: "fixed",
            bottom: 23,
            left: 23,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: 16,
            background: "#1F1A14",
            padding: "14px 20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
            {selectedSlugs.length}개 선택
          </span>
          <ListenButton
            text={selectedListenText}
            label="이어듣기"
            mobileIconOnly
            className="h-[52px] w-[52px] sm:w-auto sm:px-[18px] border-white/20 bg-white/10 text-white hover:bg-white/20"
          />
          <CompleteShareButton
            shareSlugs={selectedSlugs}
            interestSummary={selectedTitles}
            buttonLabel="공유"
            mobileIconOnly
            modalTitle="선택한 소식을 공유해보세요."
            triggerClassName="h-[52px] w-[52px] sm:w-auto sm:px-[18px] rounded-full !bg-orange-500 !border-0 !text-white hover:!bg-orange-400 text-[17px] font-bold"
          />
        </div>
      ) : null}

      {/* 즐겨찾기 */}
      {activeTab === "favorites" ? (
        <div style={{ display: "grid", gap: 14 }}>
          {filteredFavorites.map((item) => (
            <article
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: 18,
                border: "1.5px solid #F2E6D7",
                padding: 18,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              {/* 상단: 체크박스 + 배지 + 날짜 */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <input
                  type="checkbox"
                  checked={selectedSlugs.includes(item.slug)}
                  onChange={() => toggleSlug(item.slug)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: 18, height: 18, accentColor: "#E57C23", flexShrink: 0 }}
                />
                <CategoryBadge category={item.category} interestLabels={interestLabels} subInterest={item.sub_interest} />
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#9C907F", fontWeight: 600 }}>
                  {item.published_at ? formatDate(item.published_at) : "발행 전"}
                </span>
              </div>

              <Link href={`/archive/${item.slug}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 19,
                        fontWeight: 900,
                        color: "#1F1A14",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.35,
                        marginBottom: 8,
                      }}
                    >
                      {item.title}
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "#4A4037",
                        fontWeight: 500,
                      }}
                    >
                      {item.short_summary}
                    </p>
                    {item.action_line ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 10,
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: "#FFF2E3",
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#B2570F",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        ✓ {item.action_line}
                      </div>
                    ) : null}
                  </div>
                  {item.thumbnail_url ? (
                    <ContentThumbnail
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-24 h-24 shrink-0 overflow-hidden rounded-xl"
                      imgClassName="w-full h-full object-cover"
                      fallbackLabel="준비 중"
                    />
                  ) : (
                    <CategoryPlaceholder cat={item.category} size={96} />
                  )}
                </div>
              </Link>

              {/* 하단 액션 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 14,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid #F5EEE2",
                }}
              >
                <ListenButton
                  text={[item.title, item.short_summary].filter(Boolean).join(". ")}
                  className="!h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[13px] !font-semibold !text-[#7A6F62] hover:!text-[#1F1A14] !shadow-none"
                  label="듣기"
                />
                <CompleteShareButton
                  shareSlugs={[item.slug]}
                  interestSummary={item.title}
                  buttonLabel="공유"
                  triggerClassName="!h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[13px] !font-semibold !text-[#7A6F62] hover:!text-[#1F1A14] !shadow-none"
                  modalTitle="이 소식을 공유해보세요."
                />
                <FavoriteToggleButton
                  slug={item.slug}
                  contentItemId={item.id}
                  initialFavorite={true}
                  label="저장"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#7A6F62] hover:text-[#1F1A14] transition"
                />
              </div>
            </article>
          ))}
          {filteredFavorites.length === 0 ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                border: "2px dashed #E8DCC7",
                padding: 40,
                textAlign: "center",
                fontSize: 15,
                color: "#7A6F62",
                fontWeight: 600,
              }}
            >
              아직 담아둔 소식이 없습니다.
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {filteredShares.map((record) => (
            <a
              key={record.share_key}
              href={`/shared-briefs?share=${record.share_key}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                background: "#fff",
                borderRadius: 18,
                border: "1.5px solid #F2E6D7",
                padding: 18,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#E57C23", letterSpacing: "-0.01em" }}>
                  {formatDate(record.created_at)}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#9C907F", fontWeight: 600 }}>
                  조회 {record.view_count}회 · 댓글 {record.comment_count}개
                </span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {record.items.map((item, index) => (
                  <div key={`${record.share_key}-${index}`} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <CategoryBadge category={item.category} interestLabels={interestLabels} />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#1F1A14",
                        lineHeight: 1.45,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </a>
          ))}
          {filteredShares.length === 0 ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                border: "2px dashed #E8DCC7",
                padding: 40,
                textAlign: "center",
                fontSize: 15,
                color: "#7A6F62",
                fontWeight: 600,
              }}
            >
              아직 공유한 항목이 없습니다.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
