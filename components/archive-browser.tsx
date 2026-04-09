"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckSquare, ChevronRight } from "lucide-react";
import Link from "next/link";

import { CompleteShareButton } from "@/components/complete-share-button";
import { ContentThumbnail } from "@/components/content-thumbnail";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { ListenButton, playSpeech, setAutoPlayNextFn, setSpeechPlaylist } from "@/components/speech-controls";
import { SelectInput } from "@/components/ui/field";
import { type ContentSource, normalizeSources } from "@/lib/content/sources";
import { type AvatarKey } from "@/lib/profile";
import { MAIN_INTERESTS, SUB_INTERESTS } from "@/lib/content/sub-interests";
import { formatDate } from "@/lib/utils";

type ArchiveItem = {
  id: string;
  title: string;
  short_summary: string;
  action_line: string;
  source_name?: string;
  source_url?: string;
  sources?: ContentSource[];
  slug: string;
  published_at: string | null;
  share_count?: number;
  summary_type: string;
  main_interest: string;
  sub_interest: string | null;
  view_count?: number;
  thumbnail_url?: string | null;
  thumbnail_alt?: string | null;
  thumbnail_page_url?: string | null;
  thumbnail_license?: string | null;
};

const CATEGORY_STYLE: Record<string, string> = {
  "실생활": "bg-blue-50 border border-blue-200 text-blue-700",
  "건강": "bg-green-50 border border-green-200 text-green-700",
  "돈": "bg-amber-50 border border-amber-200 text-amber-700",
  "뉴스": "bg-slate-50 border border-slate-200 text-slate-700",
  "관계": "bg-rose-50 border border-rose-200 text-rose-700",
};

const ALL_TOPICS = "전체";
const ALL_SUBTOPICS = "전체";
const ALL_DATE = "all";
const TODAY_DATE = "today";
const WEEK_DATE = "week";
const MONTH_DATE = "month";
const CUSTOM_DATE = "custom";

export function ArchiveBrowser({
  items,
  shareProfile,
  favoriteIds = [],
  initialTitleQuery = "",
  initialTopic = ALL_TOPICS,
  initialSortOrder = "latest",
  featuredMode = false,
  todayMode = false,
  mainInterests = [...MAIN_INTERESTS],
  interestLabels = Object.fromEntries(MAIN_INTERESTS.map((interest) => [interest, interest])) as Record<string, string>,
  subInterestOptions = SUB_INTERESTS
}: {
  items: ArchiveItem[];
  shareProfile?: { nickname: string; avatarKey?: AvatarKey };
  favoriteIds?: string[];
  initialTitleQuery?: string;
  initialTopic?: string;
  initialSortOrder?: "latest" | "oldest" | "popular";
  featuredMode?: boolean;
  todayMode?: boolean;
  mainInterests?: string[];
  interestLabels?: Record<string, string>;
  subInterestOptions?: Record<string, string[]>;
}) {
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic || ALL_TOPICS);
  const [draftTopic, setDraftTopic] = useState<string>(initialTopic || ALL_TOPICS);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>(ALL_SUBTOPICS);
  const [draftSearchQuery, setDraftSearchQuery] = useState(initialTitleQuery);
  const [searchQuery, setSearchQuery] = useState(initialTitleQuery);
  const [dateFilter, setDateFilter] = useState<string>(ALL_DATE);
  const [customDate, setCustomDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "popular">(initialSortOrder);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [resolvedShareProfile, setResolvedShareProfile] = useState(shareProfile);
  const [resolvedFavoriteIds, setResolvedFavoriteIds] = useState(favoriteIds);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/viewer-state", {
      credentials: "same-origin",
      cache: "no-store"
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setResolvedShareProfile(data.shareProfile ?? undefined);
          setResolvedFavoriteIds(Array.isArray(data.favoriteIds) ? data.favoriteIds : []);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDraftSearchQuery(initialTitleQuery);
    setSearchQuery(initialTitleQuery);
  }, [initialTitleQuery]);

  useEffect(() => {
    setSortOrder(initialSortOrder);
  }, [initialSortOrder]);

  useEffect(() => {
    const nextTopic = mainInterests.includes(initialTopic) ? initialTopic : ALL_TOPICS;
    setSelectedTopic(nextTopic);
    setDraftTopic(nextTopic);
    setSelectedSubtopic(ALL_SUBTOPICS);
    setShowSearchPanel(false);
    setSelectedSlugs([]);
  }, [initialTopic, mainInterests]);

  useEffect(() => {
    setShowSearchPanel(false);
    setSelectedSlugs([]);
  }, [featuredMode, todayMode]);

  const visibleSubtopics = useMemo(() => {
    if (selectedTopic === ALL_TOPICS) {
      return [];
    }

    return subInterestOptions[selectedTopic] ?? [];
  }, [selectedTopic, subInterestOptions]);

  const filteredItems = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesTopic = selectedTopic === ALL_TOPICS || item.main_interest === selectedTopic;
      const matchesSubtopic = selectedSubtopic === ALL_SUBTOPICS || item.sub_interest === selectedSubtopic;
      const sourceNames = normalizeSources(item)
        .map((source) => source.name)
        .join(" ");
      const searchHaystack = [
        item.title,
        item.short_summary,
        item.action_line,
        item.main_interest,
        item.sub_interest,
        sourceNames
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearchQuery.length === 0 || searchHaystack.includes(normalizedSearchQuery);

      let matchesDate = true;
      if (item.published_at) {
        const published = new Date(item.published_at);
        const now = new Date();
        if (dateFilter === TODAY_DATE) {
          matchesDate = published.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
        } else if (dateFilter === WEEK_DATE) {
          matchesDate = now.getTime() - published.getTime() <= 1000 * 60 * 60 * 24 * 7;
        } else if (dateFilter === MONTH_DATE) {
          matchesDate = now.getTime() - published.getTime() <= 1000 * 60 * 60 * 24 * 30;
        } else if (dateFilter === CUSTOM_DATE && customDate) {
          matchesDate = published.toISOString().slice(0, 10) === customDate;
        }
      } else if (dateFilter !== ALL_DATE) {
        matchesDate = false;
      }

      return matchesTopic && matchesSubtopic && matchesSearch && matchesDate;
    });

    const sorted = [...filtered].sort((left, right) => {
      if (sortOrder === "popular") {
        return (right.view_count ?? right.share_count ?? 0) - (left.view_count ?? left.share_count ?? 0);
      }

      const leftDate = left.published_at ? new Date(left.published_at).getTime() : 0;
      const rightDate = right.published_at ? new Date(right.published_at).getTime() : 0;
      return sortOrder === "oldest" ? leftDate - rightDate : rightDate - leftDate;
    });

    if (featuredMode) {
      return sorted.slice(0, 30);
    }

    return sorted;
  }, [customDate, dateFilter, featuredMode, items, searchQuery, selectedSubtopic, selectedTopic, sortOrder]);

  const latestDate = useMemo(() => {
    if (!todayMode) return null;
    return items.reduce((max, item) => {
      const d = item.published_at?.slice(0, 10) ?? "";
      return d > max ? d : max;
    }, "");
  }, [todayMode, items]);

  const displayItems = useMemo(() => {
    if (!todayMode || !latestDate) return filteredItems;
    return filteredItems.filter((item) => item.published_at?.slice(0, 10) === latestDate);
  }, [todayMode, latestDate, filteredItems]);

  const selectedItems = displayItems.filter((item) => selectedSlugs.includes(item.slug));
  const selectedTitles = selectedItems.map((item) => item.title).join(", ");

  const selectedListenText = selectedItems
    .map((item) => [item.title, item.short_summary, item.action_line].filter(Boolean).join(". "))
    .join(". ");

  const selectedSegments = useMemo(() => {
    let offset = 0;
    return selectedItems.map((item, i) => {
      const text = [item.title, item.short_summary, item.action_line].filter(Boolean).join(". ");
      const charStart = offset;
      offset += text.length + 2; // ". " 구분자
      return { label: `${i + 1}. ${item.title}`, charStart };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlugs, displayItems]);

  function resetSearchFilters() {
    setDraftSearchQuery("");
    setSearchQuery("");
    setDateFilter(ALL_DATE);
    setCustomDate("");
  }

  function toggleSlug(slug: string) {
    setSelectedSlugs((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  }

  // 자동재생용: 최신 displayItems를 ref로 유지
  const displayItemsRef = useRef(displayItems);
  useEffect(() => { displayItemsRef.current = displayItems; }, [displayItems]);

  // idx번 아이템부터 자동재생 (autoPlayNextFn으로 호출됨)
  const playFromIdx = useCallback((idx: number) => {
    const items = displayItemsRef.current;
    const item = items[idx];
    if (!item) return;
    const nextItem = items[idx + 1];
    const text = [item.title, item.short_summary, item.action_line].filter(Boolean).join(". ");
    setSpeechPlaylist(
      [{ label: item.title }, ...(nextItem ? [{ label: nextItem.title }] : [])],
      0
    );
    playSpeech(text, item.title);
    setAutoPlayNextFn(nextItem ? () => playFromIdx(idx + 1) : null);
  }, []);

  // 카드 ListenButton의 onPlay: 플레이리스트 설정 + 다음 자동재생 등록
  const handleCardPlay = useCallback((idx: number) => {
    const items = displayItemsRef.current;
    const nextItem = items[idx + 1];
    setSpeechPlaylist(
      [{ label: items[idx]!.title }, ...(nextItem ? [{ label: nextItem.title }] : [])],
      0
    );
    setAutoPlayNextFn(nextItem ? () => playFromIdx(idx + 1) : null);
  }, [playFromIdx]);

  return (
      <div className={`pb-20 sm:pb-12 ${featuredMode ? "space-y-6 pt-10 md:pt-14" : "space-y-4"}`}>
      {!featuredMode && todayMode ? <div className="h-[49px]" /> : null}
      {!featuredMode && !todayMode ? (
        <div data-search-filter className="-mx-4 sm:-mx-6 border-b border-gray-200 bg-white !mt-0">
          <div className="flex items-center gap-[6px] px-[16px] pt-[16px] pb-[10px] sm:px-[24px]">
            {/* 좌: 스크롤 가능한 필터 칩 */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
              <SelectInput
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
                className="!min-h-[32px] !h-[32px] !w-auto !min-w-0 !max-w-[80px] !rounded-full !px-[10px] !text-[14px] shrink-0"
              >
                <option value="latest">최신순</option>
                <option value="oldest">과거순</option>
                <option value="popular">인기순</option>
              </SelectInput>
              {[
                { key: ALL_DATE, label: "전체" },
                { key: TODAY_DATE, label: "오늘" },
                { key: WEEK_DATE, label: "이번주" },
                { key: MONTH_DATE, label: "이번달" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setDateFilter(option.key)}
                  className={`inline-flex h-[32px] shrink-0 items-center rounded-full border px-[14px] text-[14px] font-medium transition ${
                    dateFilter === option.key
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              {(!initialTopic || initialTopic === ALL_TOPICS) ? (
                <SelectInput
                  value={selectedTopic}
                  onChange={(event) => { setSelectedTopic(event.target.value); setDraftTopic(event.target.value); setSelectedSubtopic(ALL_SUBTOPICS); }}
                  className="!min-h-[32px] !h-[32px] !w-auto !min-w-0 !max-w-[90px] !rounded-full !px-[10px] !text-[14px] shrink-0"
                >
                  <option value={ALL_TOPICS}>전체</option>
                  {mainInterests.map((topic) => (
                    <option key={topic} value={topic}>{interestLabels[topic] ?? topic}</option>
                  ))}
                </SelectInput>
              ) : null}
            </div>
            {/* 우: 검색 + 전체선택 고정 */}
            <div className="flex shrink-0 items-center gap-1.5">
              <input
                value={draftSearchQuery}
                onChange={(event) => setDraftSearchQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") setSearchQuery(draftSearchQuery.trim()); }}
                placeholder="검색"
                className="hidden sm:block h-[32px] w-[120px] rounded-full border border-gray-200 px-[10px] text-[14px] text-gray-800 outline-none transition focus:border-orange-300"
              />
              <button
                type="button"
                onClick={() => setSearchQuery(draftSearchQuery.trim())}
                className="hidden sm:inline-flex h-[32px] shrink-0 items-center rounded-full bg-navy-900 px-[14px] text-[14px] font-medium text-white transition hover:bg-navy-700"
              >
                검색
              </button>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setDraftSearchQuery(""); setSearchQuery(""); }}
                  className="hidden sm:inline-flex h-[32px] shrink-0 items-center rounded-full border border-gray-200 bg-white px-[10px] text-[14px] font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  ✕
                </button>
              ) : null}
              {resolvedShareProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = displayItems.every((item) => selectedSlugs.includes(item.slug));
                    setSelectedSlugs(allSelected ? [] : displayItems.map((item) => item.slug));
                  }}
                  className="hidden sm:inline-flex h-[32px] shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white px-[14px] text-[14px] font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  전체선택
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {visibleSubtopics.length > 0 ? (
        <div data-search-filter className="flex flex-wrap gap-2 pt-1">
          {[ALL_SUBTOPICS, ...visibleSubtopics].map((subtopic) => (
            <button
              key={subtopic}
              type="button"
              onClick={() => {
                setSelectedSubtopic(subtopic);
                if (!showSearchPanel) {
                  resetSearchFilters();
                }
              }}
              className={`rounded-full px-[14px] py-[7px] text-[14px] font-semibold transition ${
                selectedSubtopic === subtopic ? "bg-orange-500 text-white" : "border border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-100"
              }`}
            >
              {subtopic}
            </button>
          ))}
        </div>
      ) : null}

      {selectedSlugs.length > 0 ? (
        <div className="fixed bottom-[34px] left-1/2 z-40 -translate-x-1/2 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-[12px] rounded-full border border-navy-200 bg-white px-[29px] py-[17px] shadow-[0_8px_40px_rgba(17,32,51,0.18)]">
            <span className="whitespace-nowrap text-[20px] font-semibold text-navy-900">{selectedSlugs.length}개 선택됨</span>
            <div className="h-[23px] w-px bg-navy-200" />
            <ListenButton
              text={selectedListenText}
              speechTitle={`${selectedSlugs.length}개 선택`}
              segments={selectedSegments}
              label="이어듣기"
              mobileIconOnly
              className="h-[52px] w-[52px] sm:w-auto sm:px-[17px] !border-navy-200 !bg-white !text-navy-700 hover:!bg-navy-50"
            />
            {resolvedShareProfile ? (
              <CompleteShareButton
                shareSlugs={selectedSlugs}
                interestSummary={selectedTitles}
                buttonLabel="공유"
                mobileIconOnly
                modalTitle="선택한 지난 소식을 공유해보세요."
                triggerClassName="h-[52px] w-[52px] sm:w-auto sm:px-[17px] rounded-full !bg-orange-500 !border-0 !text-white hover:!bg-orange-400 text-[20px] font-semibold"
              />
            ) : null}
          </div>
        </div>
      ) : null}


      <div className="grid gap-3">
        {displayItems.length === 0 ? (
          <div className="rounded-xl border border-navy-100 bg-white px-5 py-10 text-center md:px-8 md:py-14">
            <p className="text-lg font-bold text-navy-900 md:text-xl">{todayMode ? "오늘 등록된 콘텐츠가 없습니다." : "검색 결과가 없습니다."}</p>
            <p className="mt-3 text-sm leading-7 text-navy-600 md:text-base">
              {todayMode ? "잠시 후 다시 확인해보세요." : "다른 검색어를 입력하거나 카테고리와 날짜 범위를 다시 선택해보세요."}
            </p>
          </div>
        ) : null}
        {displayItems.map((item, idx) => (
          <article
            key={item.id}
            className="rounded-xl border border-navy-100 bg-white p-[18px] transition-shadow hover:shadow-md md:p-5"
          >
            {/* 상단: 카테고리 + 날짜 */}
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              {resolvedShareProfile ? (
                <input
                  type="checkbox"
                  checked={selectedSlugs.includes(item.slug)}
                  onChange={() => toggleSlug(item.slug)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 shrink-0 rounded border-navy-200 text-orange-500 focus:ring-orange-200"
                />
              ) : null}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[item.main_interest] ?? "bg-orange-50 border border-orange-200 text-orange-700"}`}>
                {interestLabels[item.main_interest] ?? item.main_interest}
                {item.sub_interest ? ` · ${item.sub_interest}` : ""}
              </span>
              <span className="ml-auto text-xs text-navy-400">
                {item.published_at ? formatDate(item.published_at) : "발행 전"}
              </span>
            </div>

            {/* 본문 */}
            <Link href={`/archive/${item.slug}`} className="group block">
              <div className="md:flex md:items-stretch md:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-stretch gap-3">
                    <h2 className="flex-1 md:flex-none text-[1.45rem] font-bold leading-snug break-keep text-navy-900 transition group-hover:text-orange-600">
                      {item.title}
                    </h2>
                    {item.thumbnail_url ? (
                      <ContentThumbnail
                        src={item.thumbnail_url}
                        alt={item.thumbnail_alt?.trim() || item.title}
                        className="w-20 min-h-[5rem] shrink-0 overflow-hidden rounded-md md:hidden"
                        imgClassName="w-full h-full object-cover"
                        fallbackLabel="준비 중"
                      />
                    ) : null}
                  </div>
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
                    alt={item.thumbnail_alt?.trim() || item.title}
                    className="hidden md:block w-28 min-h-[6rem] shrink-0 overflow-hidden rounded-md"
                    imgClassName="w-full h-full object-cover"
                    fallbackLabel="준비 중"
                  />
                ) : null}
              </div>
            </Link>

            {/* 하단: 액션 버튼 */}
            <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
              <ListenButton
                text={[item.title, item.short_summary, item.action_line].filter(Boolean).join(". ")}
                speechTitle={item.title}
                className="!h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[0.82rem] !font-normal !text-gray-500 hover:!text-gray-800 !shadow-none"
                label="듣기"
                onPlay={() => handleCardPlay(idx)}
              />
              <CompleteShareButton
                shareSlugs={[item.slug]}
                interestSummary={item.title}
                buttonLabel="공유"
                triggerClassName="!h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[0.82rem] !font-normal !text-gray-500 hover:!text-gray-800 !shadow-none"
                modalTitle="이 소식을 공유해보세요."
              />
              <div className="flex-1" />
              {(item.view_count ?? 0) > 0 ? (
                <span className="text-xs text-gray-400">{(item.view_count ?? 0).toLocaleString()} 조회</span>
              ) : null}
              {resolvedShareProfile ? (
                <FavoriteToggleButton
                  slug={item.slug}
                  contentItemId={item.id}
                  initialFavorite={resolvedFavoriteIds.includes(item.slug)}
                  label="저장"
                  className="inline-flex items-center gap-1 text-[0.82rem] text-gray-500 transition hover:text-gray-800"
                />
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {showLoginPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/45 px-5 py-8">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-navy-100 md:p-8">
            <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">공유 안내</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-navy-900">로그인 후 공유하실 수 있어요.</h2>
            <p className="mt-4 text-base leading-7 text-navy-700">내 프로필 정보와 함께 공유되기 때문에 먼저 로그인해 주세요.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-navy-900 px-5 py-3 text-base font-semibold text-white"
              >
                로그인하기
              </button>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-navy-200 bg-white px-5 py-3 text-base font-semibold text-navy-900"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
