"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { CompleteShareButton } from "@/components/complete-share-button";
import { ContentThumbnail } from "@/components/content-thumbnail";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { ListenButton } from "@/components/speech-controls";
import { type ContentSource } from "@/lib/content/sources";
import { formatDate } from "@/lib/utils";

const CATEGORY_STYLE: Record<string, string> = {
  "실생활": "bg-blue-50 border border-blue-200 text-blue-700",
  "건강": "bg-green-50 border border-green-200 text-green-700",
  "돈": "bg-amber-50 border border-amber-200 text-amber-700",
  "뉴스": "bg-slate-50 border border-slate-200 text-slate-700",
  "관계": "bg-rose-50 border border-rose-200 text-rose-700",
};

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
  interestLabels
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
    setSelectedSlugs((current) => current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]);
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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {[
          { key: "favorites", label: "즐겨찾기" },
          { key: "shares", label: "공유" }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as "favorites" | "shares")}
            className={`inline-flex h-8 shrink-0 items-center rounded-md px-2.5 text-[0.8rem] font-medium transition ${
              activeTab === tab.key ? "border border-navy-900 bg-navy-900 text-white" : "border border-gray-200 bg-white text-navy-800 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="-mx-4 sm:-mx-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {favoriteInterests.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => setSelectedInterest(interest)}
                className={`rounded-full px-[14px] py-[7px] text-[14px] font-semibold transition ${
                  selectedInterest === interest
                    ? "bg-orange-500 text-white"
                    : "border border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-100"
                }`}
              >
                {interest === "전체" ? "전체" : interestLabels[interest] ?? interest}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") setQuery(query.trim()); }}
              placeholder="검색"
              className="h-8 w-24 rounded-md border border-gray-200 px-2 text-[0.8rem] text-gray-800 outline-none transition focus:border-orange-300 sm:w-36"
            />
            <button
              type="button"
              onClick={() => setQuery(query.trim())}
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-navy-900 px-2.5 text-[0.8rem] font-medium text-white transition hover:bg-navy-700"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {selectedSlugs.length > 0 ? (
        <div className="fixed bottom-[23px] left-[23px] z-40 flex items-center gap-[12px] rounded-2xl border border-navy-700 bg-navy-900 px-[23px] py-[17px] shadow-[0_8px_40px_rgba(17,32,51,0.4)] sm:bottom-[138px]">
          <p className="mr-[6px] text-[20px] font-semibold text-white">{selectedSlugs.length}개 선택</p>
          <ListenButton
            text={selectedListenText}
            label="이어듣기"
            mobileIconOnly
            className="h-[57px] w-[57px] sm:w-auto sm:px-[20px] border-white/20 bg-white/10 text-white hover:bg-white/20"
          />
          <CompleteShareButton
            shareSlugs={selectedSlugs}
            interestSummary={selectedTitles}
            buttonLabel="공유"
            mobileIconOnly
            modalTitle="선택한 소식을 공유해보세요."
            triggerClassName="h-[57px] w-[57px] sm:w-auto sm:px-[20px] rounded-full !bg-orange-500 !border-0 !text-white hover:!bg-orange-400 text-[20px] font-semibold"
          />
        </div>
      ) : null}

      {activeTab === "favorites" ? (
        <div className="grid gap-4 md:gap-5">
          {filteredFavorites.map((item) => (
            <article key={item.id} className="rounded-xl border border-navy-100 bg-white p-4 transition-shadow hover:shadow-md md:p-5">
              {/* 상단: 카테고리 + 날짜 */}
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <input
                  type="checkbox"
                  checked={selectedSlugs.includes(item.slug)}
                  onChange={() => toggleSlug(item.slug)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 shrink-0 rounded border-navy-200 text-orange-500 focus:ring-orange-200"
                />
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[item.category] ?? "bg-orange-50 border border-orange-200 text-orange-700"}`}>
                  {interestLabels[item.category] ?? item.category}
                  {item.sub_interest ? ` · ${item.sub_interest}` : ""}
                </span>
                <span className="ml-auto text-xs text-navy-400">
                  {item.published_at ? formatDate(item.published_at) : "발행 전"}
                </span>
              </div>

              {/* 본문 */}
              <Link href={`/archive/${item.slug}`} className="group block">
                <div className="flex items-stretch gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[1.45rem] font-bold leading-snug break-keep text-navy-900 transition group-hover:text-orange-600">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 break-keep text-navy-600">
                      {item.short_summary}
                    </p>
                    {item.action_line ? (
                      <p className="mt-1.5 text-sm font-semibold text-orange-600">
                        {item.action_line}
                        <ChevronRight className="ml-[2px] inline h-[14px] w-[14px] align-middle" aria-hidden="true" />
                      </p>
                    ) : null}
                  </div>
                  {item.thumbnail_url ? (
                    <ContentThumbnail
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-20 min-h-[5rem] shrink-0 overflow-hidden rounded-md"
                      imgClassName="w-full h-full object-cover"
                      fallbackLabel="준비 중"
                    />
                  ) : null}
                </div>
              </Link>

              {/* 하단: 액션 버튼 */}
              <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                <ListenButton
                  text={[item.title, item.short_summary].filter(Boolean).join(". ")}
                  className="!h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[0.82rem] !font-normal !text-gray-500 hover:!text-gray-800 !shadow-none"
                  label="듣기"
                />
                <CompleteShareButton
                  shareSlugs={[item.slug]}
                  interestSummary={item.title}
                  buttonLabel="공유"
                  triggerClassName="!h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[0.82rem] !font-normal !text-gray-500 hover:!text-gray-800 !shadow-none"
                  modalTitle="이 소식을 공유해보세요."
                />
                <div className="flex-1" />
                <FavoriteToggleButton
                  slug={item.slug}
                  contentItemId={item.id}
                  initialFavorite={true}
                  label="저장"
                  className="inline-flex items-center gap-1 text-[0.82rem] text-gray-500 transition hover:text-gray-800"
                />
              </div>
            </article>
          ))}
          {filteredFavorites.length === 0 ? <div className="rounded-xl border border-dashed border-navy-200 bg-white p-6 text-navy-600">아직 담아둔 소식이 없습니다.</div> : null}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShares.map((record) => (
            <div key={record.share_key} className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-orange-500">{formatDate(record.created_at)}</p>
                  <p className="mt-1 text-lg font-bold text-navy-900">조회 {record.view_count}회 · 댓글 {record.comment_count}개</p>
                </div>
                <a
                  href={`/shared-briefs?share=${record.share_key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-800"
                >
                  공유 링크 열기
                </a>
              </div>
              <div className="mt-4 grid gap-3">
                {record.items.map((item, index) => (
                  <div key={`${record.share_key}-${index}`} className="rounded-xl bg-navy-50 p-4">
                    <div className="mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[item.category] ?? "bg-orange-50 border border-orange-200 text-orange-700"}`}>
                        {interestLabels[item.category] ?? item.category}
                        {item.sub_interest ? ` · ${item.sub_interest}` : ""}
                      </span>
                    </div>
                    <p className="text-[0.85rem] font-bold leading-snug text-navy-900">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredShares.length === 0 ? <div className="rounded-xl border border-dashed border-navy-200 bg-white p-6 text-navy-600">아직 공유한 항목이 없습니다.</div> : null}
        </div>
      )}
    </div>
  );
}
