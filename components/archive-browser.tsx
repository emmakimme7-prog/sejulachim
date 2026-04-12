"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckSquare, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CompleteShareButton } from "@/components/complete-share-button";
import { ContentThumbnail } from "@/components/content-thumbnail";
import { FeedProductCard } from "@/components/feed-product-card";
import { type ResolvedAffiliateProduct } from "@/lib/products/catalog";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { ListenButton, playSpeech, setAutoPlayNextFn, setSpeechPlaylist } from "@/components/speech-controls";
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
  subInterestOptions = SUB_INTERESTS,
  feedProducts = []
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
  feedProducts?: ResolvedAffiliateProduct[];
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
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showInlineSearch, setShowInlineSearch] = useState(false);
  const [isFeatureView, setIsFeatureView] = useState(featuredMode);
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
    setShowSortMenu(false);
    setSelectedSlugs([]);
  }, [initialTopic, mainInterests]);

  const [localTodayMode, setLocalTodayMode] = useState(todayMode);
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsFeatureView(featuredMode);
    setLocalTodayMode(todayMode);
    setShowSortMenu(false);
    setSelectedSlugs([]);
  }, [featuredMode, todayMode]);

  // GNB 탭 전환 감지 — router.push에 의한 searchParams 변화 반영
  const prevSearchRef = useRef(searchParams.toString());
  useEffect(() => {
    const current = searchParams.toString();
    if (current === prevSearchRef.current) return;
    prevSearchRef.current = current;

    const category = searchParams.get("category")?.trim() ?? "";
    const view = searchParams.get("view")?.trim() ?? "";
    const q = searchParams.get("q")?.trim() ?? "";

    const nextTopic = category && mainInterests.includes(category) ? category : ALL_TOPICS;
    setSelectedTopic(nextTopic);
    setDraftTopic(nextTopic);
    setSelectedSubtopic(ALL_SUBTOPICS);
    setDraftSearchQuery(q);
    setSearchQuery(q);
    setSelectedSlugs([]);
    setShowSortMenu(false);

    // 뷰 전환
    const isToday = view === "today";
    setLocalTodayMode(isToday);
    setDateFilter(ALL_DATE);
    setCustomDate("");
    if (isToday) {
      setTodaySelectedDate(new Date().toISOString().slice(0, 10));
      setSelectedTopic(ALL_TOPICS);
      setDraftTopic(ALL_TOPICS);
      setSelectedSubtopic(ALL_SUBTOPICS);
    }
    if (category || q || view) {
      setIsFeatureView(false);
      setSortOrder("latest");
    } else {
      setIsFeatureView(true);
      setSortOrder("popular");
    }

    window.scrollTo({ top: 0 });
  }, [searchParams, mainInterests]);

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

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const sorted = [...filtered].sort((left, right) => {
      if (sortOrder === "popular") {
        return (right.view_count ?? 0) - (left.view_count ?? 0);
      }

      const leftDate = left.published_at ? new Date(left.published_at).getTime() : 0;
      const rightDate = right.published_at ? new Date(right.published_at).getTime() : 0;
      return sortOrder === "oldest" ? leftDate - rightDate : rightDate - leftDate;
    });

    if (isFeatureView) {
      return sorted.slice(0, 10);
    }

    return sorted;
  }, [customDate, dateFilter, isFeatureView, items, searchQuery, selectedSubtopic, selectedTopic, sortOrder]);

  const latestDate = useMemo(() => {
    if (!localTodayMode) return null;
    return items.reduce((max, item) => {
      const d = item.published_at?.slice(0, 10) ?? "";
      return d > max ? d : max;
    }, "");
  }, [localTodayMode, items]);

  // 오늘 탭 전용: 선택 날짜 (기본 = 오늘 = latestDate)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [todaySelectedDate, setTodaySelectedDate] = useState<string>(todayStr);

  // todayMode 진입 시 오늘 날짜로 초기화
  useEffect(() => {
    if (localTodayMode) setTodaySelectedDate(todayStr);
  }, [localTodayMode, todayStr]);

  const displayItems = useMemo(() => {
    if (!localTodayMode) return filteredItems;
    if (!todaySelectedDate) return filteredItems; // "전체"
    if (todaySelectedDate === "week") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return filteredItems.filter((item) => item.published_at && new Date(item.published_at).getTime() >= cutoff);
    }
    if (todaySelectedDate === "month") {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return filteredItems.filter((item) => item.published_at && new Date(item.published_at).getTime() >= cutoff);
    }
    return filteredItems.filter((item) => item.published_at?.slice(0, 10) === todaySelectedDate);
  }, [localTodayMode, todaySelectedDate, filteredItems]);

  // 무한 스크롤: 10개씩 표시
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 필터/카테고리 변경 시 visibleCount 초기화
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedTopic, selectedSubtopic, searchQuery, dateFilter, sortOrder, localTodayMode, todaySelectedDate]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, displayItems.length));
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayItems.length]);

  const visibleItems = useMemo(() => displayItems.slice(0, visibleCount), [displayItems, visibleCount]);

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

    // 해당 카드로 스크롤 이동
    const articleElements = document.querySelectorAll("[data-archive-item]");
    const targetEl = articleElements[idx];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

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
      <div className={`pb-20 sm:pb-12 ${isFeatureView ? "space-y-3 pt-2 md:pt-4" : "space-y-3"}`}>
      {!isFeatureView && localTodayMode ? (
        <div className="-mx-4 sm:-mx-6 border-b border-gray-200 bg-white !mt-0">
          {/* 날짜 필터 행 */}
          <div className="flex items-center gap-1.5 px-[16px] pt-[16px] pb-[10px] sm:px-[24px] overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {(() => {
              const isCustomDate = todaySelectedDate && todaySelectedDate !== todayStr && todaySelectedDate !== "week" && todaySelectedDate !== "month";
              return (
                <div className="flex shrink-0 items-center gap-1">
                  <label
                    className={`relative inline-flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border transition ${
                      isCustomDate
                        ? "border-navy-900 bg-navy-900 text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <CalendarDays className="h-[16px] w-[16px]" />
                    <input
                      type="date"
                      value={todaySelectedDate !== "week" && todaySelectedDate !== "month" && todaySelectedDate !== "" ? todaySelectedDate : ""}
                      onChange={(event) => { if (event.target.value) setTodaySelectedDate(event.target.value); }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                  {isCustomDate ? (
                    <span className="inline-flex h-[32px] shrink-0 items-center gap-1 rounded-full border border-navy-900 bg-navy-900 pl-[10px] pr-[6px] text-[13px] font-medium text-white">
                      {todaySelectedDate.slice(5).replace("-", "/")}
                      <button
                        type="button"
                        onClick={() => setTodaySelectedDate(todayStr)}
                        className="inline-flex h-[20px] w-[20px] items-center justify-center rounded-full text-white/70 transition hover:bg-white/20 hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ) : null}
                </div>
              );
            })()}
            {[
              { key: todayStr, label: "오늘" },
              { key: "week", label: "이번주" },
              { key: "month", label: "이번달" },
              { key: "all", label: "전체" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  if (option.key === "all") setTodaySelectedDate("");
                  else if (option.key === "week" || option.key === "month") setTodaySelectedDate(option.key);
                  else setTodaySelectedDate(option.key);
                }}
                className={`inline-flex h-[32px] shrink-0 items-center whitespace-nowrap rounded-full border px-[14px] text-[14px] font-medium transition ${
                  todaySelectedDate === option.key || (!todaySelectedDate && option.key === "all")
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {/* 검색 아이콘 */}
              <button
                type="button"
                onClick={() => setShowInlineSearch((v) => !v)}
                className={`inline-flex h-[32px] w-[32px] items-center justify-center rounded-full border transition ${
                  showInlineSearch || searchQuery
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
                aria-label="검색"
              >
                <Search className="h-[16px] w-[16px]" />
              </button>
              {/* 정렬 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortMenu((v) => !v)}
                  className={`inline-flex h-[32px] w-[32px] items-center justify-center rounded-full border transition ${
                    showSortMenu
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  aria-label="정렬"
                >
                  <SlidersHorizontal className="h-[16px] w-[16px]" />
                </button>
                {showSortMenu ? (
                  <div className="absolute right-0 top-[36px] z-20 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    {(["latest", "oldest", "popular"] as const).map((order) => (
                      <button
                        key={order}
                        type="button"
                        onClick={() => { setSortOrder(order); setShowSortMenu(false); }}
                        className={`block w-full whitespace-nowrap rounded-lg px-4 py-2 text-left text-[14px] font-medium transition ${
                          sortOrder === order ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {order === "latest" ? "최신순" : order === "oldest" ? "과거순" : "인기순"}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {/* 검색 인풋 (토글) */}
          {showInlineSearch ? (
            <div className="flex items-center gap-1.5 px-[16px] pb-[10px] sm:px-[24px]">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-[10px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={draftSearchQuery}
                  onChange={(event) => setDraftSearchQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") setSearchQuery(draftSearchQuery.trim()); }}
                  placeholder="키워드 검색"
                  className="h-[32px] w-full rounded-full border border-gray-200 pl-[30px] pr-[10px] text-[14px] text-gray-800 outline-none transition focus:border-orange-300"
                />
              </div>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setDraftSearchQuery(""); setSearchQuery(""); }}
                  className="inline-flex h-[32px] shrink-0 items-center rounded-full border border-gray-200 bg-white px-[10px] text-[13px] font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  ✕ 초기화
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {!isFeatureView && !localTodayMode ? (
        <div data-search-filter className="-mx-4 sm:-mx-6 border-b border-gray-200 bg-white !mt-0">
          {/* 날짜 필터 행 */}
          <div className="flex items-center gap-1.5 px-[16px] pt-[16px] pb-[10px] sm:px-[24px] overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
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
                className={`inline-flex h-[32px] shrink-0 items-center whitespace-nowrap rounded-full border px-[14px] text-[14px] font-medium transition ${
                  dateFilter === option.key
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setShowInlineSearch((v) => !v)}
                className={`inline-flex h-[32px] w-[32px] items-center justify-center rounded-full border transition ${
                  showInlineSearch || searchQuery
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
                aria-label="검색"
              >
                <Search className="h-[16px] w-[16px]" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortMenu((v) => !v)}
                  className={`inline-flex h-[32px] w-[32px] items-center justify-center rounded-full border transition ${
                    showSortMenu
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  aria-label="정렬"
                >
                  <SlidersHorizontal className="h-[16px] w-[16px]" />
                </button>
                {showSortMenu ? (
                  <div className="absolute right-0 top-[36px] z-20 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    {(["latest", "oldest", "popular"] as const).map((order) => (
                      <button
                        key={order}
                        type="button"
                        onClick={() => { setSortOrder(order); setShowSortMenu(false); }}
                        className={`block w-full whitespace-nowrap rounded-lg px-4 py-2 text-left text-[14px] font-medium transition ${
                          sortOrder === order ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {order === "latest" ? "최신순" : order === "oldest" ? "과거순" : "인기순"}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {/* 검색 인풋 (토글) */}
          {showInlineSearch ? (
            <div className="flex items-center gap-1.5 px-[16px] pb-[10px] sm:px-[24px]">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-[10px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={draftSearchQuery}
                  onChange={(event) => setDraftSearchQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") setSearchQuery(draftSearchQuery.trim()); }}
                  placeholder="키워드 검색"
                  className="h-[32px] w-full rounded-full border border-gray-200 pl-[30px] pr-[10px] text-[14px] text-gray-800 outline-none transition focus:border-orange-300"
                />
              </div>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setDraftSearchQuery(""); setSearchQuery(""); }}
                  className="inline-flex h-[32px] shrink-0 items-center rounded-full border border-gray-200 bg-white px-[10px] text-[13px] font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  ✕ 초기화
                </button>
              ) : null}
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
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-gray-500 mt-4 text-center rounded-lg bg-gray-50 py-2 px-3">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>

      {/* 카테고리 필터 (쿠팡 멘트 아래) */}
      {!isFeatureView ? (
        <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {[ALL_TOPICS, ...mainInterests].map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => { setSelectedTopic(topic); setDraftTopic(topic); setSelectedSubtopic(ALL_SUBTOPICS); }}
              className={`inline-flex h-[32px] shrink-0 items-center whitespace-nowrap rounded-full border px-[14px] text-[14px] font-medium transition ${
                selectedTopic === topic
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {topic === ALL_TOPICS ? "전체" : (interestLabels[topic] ?? topic)}
            </button>
          ))}
        </div>
      ) : null}

      {visibleSubtopics.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {[ALL_SUBTOPICS, ...visibleSubtopics].map((subtopic) => (
            <button
              key={subtopic}
              type="button"
              onClick={() => {
                setSelectedSubtopic(subtopic);
                if (!showSortMenu) {
                  resetSearchFilters();
                }
              }}
              className={`whitespace-nowrap rounded-full px-[10px] h-[26px] text-[12px] font-medium transition ${
                selectedSubtopic === subtopic ? "bg-orange-100 text-orange-700 border border-orange-300" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {subtopic}
            </button>
          ))}
        </div>
      ) : null}

      {selectedSlugs.length > 0 ? (
        <div className="fixed bottom-[34px] left-1/2 z-40 -translate-x-1/2 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-[8px] rounded-full border border-navy-200 bg-white pl-[16px] pr-[8px] py-[8px] shadow-[0_8px_40px_rgba(17,32,51,0.18)]">
            <span className="whitespace-nowrap text-[14px] font-semibold text-navy-900">{selectedSlugs.length}개 선택</span>
            <div className="h-[20px] w-px bg-navy-200" />
            <ListenButton
              text={selectedListenText}
              speechTitle={`${selectedSlugs.length}개 선택`}
              segments={selectedSegments}
              label="듣기"
              mobileIconOnly
              className="h-[36px] w-[36px] sm:w-auto sm:px-[12px] !border-navy-200 !bg-white !text-navy-700 hover:!bg-navy-50 !text-[13px]"
            />
            {resolvedShareProfile ? (
              <CompleteShareButton
                shareSlugs={selectedSlugs}
                interestSummary={selectedTitles}
                buttonLabel="공유"
                mobileIconOnly
                modalTitle="선택한 지난 소식을 공유해보세요."
                triggerClassName="h-[36px] w-[36px] sm:w-auto sm:px-[12px] rounded-full !bg-orange-500 !border-0 !text-white hover:!bg-orange-400 !text-[13px] font-semibold"
              />
            ) : null}
            <button
              type="button"
              onClick={() => setSelectedSlugs([])}
              className="inline-flex h-[36px] w-[36px] items-center justify-center rounded-full text-navy-400 transition hover:bg-navy-100 hover:text-navy-700"
              aria-label="선택 해제"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}


      <div className="grid gap-3">
        {displayItems.length === 0 ? (
          <div className="rounded-xl border border-navy-100 bg-white px-5 py-10 text-center md:px-8 md:py-14">
            <p className="text-lg font-bold text-navy-900 md:text-xl">{localTodayMode ? "오늘뉴스가 아직 등록되지 않았습니다." : "검색 결과가 없습니다."}</p>
            <p className="mt-3 text-sm leading-7 text-navy-600 md:text-base">
              {localTodayMode ? "잠시 후 다시 확인해보세요." : "다른 검색어를 입력하거나 카테고리와 날짜 범위를 다시 선택해보세요."}
            </p>
          </div>
        ) : null}
        {visibleItems.map((item, idx) => {
          // 상품 카드 삽입: 5번째(idx=4), 10번째(idx=9) 기사 뒤
          const productSlotIndex = idx === 4 ? 0 : idx === 9 ? 1 : -1;
          const feedProduct = productSlotIndex >= 0 ? feedProducts[productSlotIndex] ?? null : null;

          return (
            <div key={item.id}>
              <article
                data-archive-item
                className="border-b border-navy-100 pb-[18px] pt-[18px] md:rounded-xl md:border md:border-navy-100 md:bg-white md:p-5 md:shadow-none md:hover:shadow-md"
              >
                {/* 상단: 카테고리 + 날짜 */}
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <input
                    type="checkbox"
                    checked={selectedSlugs.includes(item.slug)}
                    onChange={() => toggleSlug(item.slug)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 shrink-0 rounded border-navy-200 text-orange-500 focus:ring-orange-200"
                  />
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
                      {/* 모바일 글씨 중간/크게: 썸네일 상단 배치 */}
                      {item.thumbnail_url ? (
                        <ContentThumbnail
                          src={item.thumbnail_url}
                          alt={item.thumbnail_alt?.trim() || item.title}
                          className="mb-3 aspect-[16/9] w-full overflow-hidden rounded-md font-size-top-thumb md:hidden"
                          imgClassName="w-full h-full object-cover"
                          fallbackLabel="준비 중"
                        />
                      ) : null}
                      <div className="flex items-stretch gap-3">
                        <h2 className="flex-1 md:flex-none text-[1.45rem] font-bold leading-snug break-all text-navy-900 transition group-hover:text-orange-600">
                          {item.title}
                        </h2>
                        {/* 모바일 글씨 작게: 썸네일 제목 옆 배치 */}
                        {item.thumbnail_url ? (
                          <ContentThumbnail
                            src={item.thumbnail_url}
                            alt={item.thumbnail_alt?.trim() || item.title}
                            className="w-20 min-h-[5rem] shrink-0 overflow-hidden rounded-md font-size-side-thumb md:hidden"
                            imgClassName="w-full h-full object-cover"
                            fallbackLabel="준비 중"
                          />
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 break-all text-navy-600">
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
                <div className="mt-3 flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
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
              {feedProduct ? <FeedProductCard product={feedProduct} /> : null}
            </div>
          );
        })}
      </div>

      {visibleCount < displayItems.length && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          <span className="text-sm text-gray-400">더 불러오는 중...</span>
        </div>
      )}

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
