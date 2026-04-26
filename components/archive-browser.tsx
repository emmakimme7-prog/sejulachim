"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CompleteShareButton } from "@/components/complete-share-button";
import { ContentThumbnail } from "@/components/content-thumbnail";
import { type ResolvedAffiliateProduct } from "@/lib/products/catalog";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { ListenButton, playListenable, setAutoPlayNextFn, setSpeechPlaylist, SpeechSearchButton } from "@/components/speech-controls";
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
  audio_url?: string | null;
};

const CATEGORY_STYLE: Record<string, string> = {
  "실생활": "bg-blue-50 border border-blue-200 text-blue-700",
  "건강": "bg-green-50 border border-green-200 text-green-700",
  "돈": "bg-amber-50 border border-amber-200 text-amber-700",
  "뉴스": "bg-slate-50 border border-slate-200 text-slate-700",
  "관계": "bg-rose-50 border border-rose-200 text-rose-700",
};

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF" },
};

function seniorCategoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };
}

function CategoryPlaceholder({ cat, size = 96 }: { cat: string; size?: number }) {
  const m = seniorCategoryMeta(cat);
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

/** UTC Date를 KST(+9) 날짜 문자열 YYYY-MM-DD로 변환 */
function toKSTDateString(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

const ALL_TOPICS = "전체";
const ALL_SUBTOPICS = "전체";
const ALL_DATE = "all";
const TODAY_DATE = "today";
const YESTERDAY_DATE = "yesterday";
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
  feedProductMap = {} as Record<string, ResolvedAffiliateProduct[]>
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
  feedProductMap?: Record<string, ResolvedAffiliateProduct[]>;
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
  const [showCalendar, setShowCalendar] = useState<"normal" | "today" | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() }; });
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

  const baseFilteredItems = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
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
      return matchesTopic && matchesSubtopic && matchesSearch;
    });
  }, [items, searchQuery, selectedSubtopic, selectedTopic]);

  const availableDateSet = useMemo(() => {
    const dates = new Set<string>();
    for (const item of baseFilteredItems) {
      if (!item.published_at) continue;
      dates.add(toKSTDateString(new Date(item.published_at)));
    }
    return dates;
  }, [baseFilteredItems]);

  const filteredItems = useMemo(() => {
    const filtered = baseFilteredItems.filter((item) => {
      let matchesDate = true;
      if (item.published_at) {
        const published = new Date(item.published_at);
        const now = new Date();
        if (dateFilter === TODAY_DATE) {
          matchesDate = toKSTDateString(published) === toKSTDateString(now);
        } else if (dateFilter === YESTERDAY_DATE) {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          matchesDate = toKSTDateString(published) === toKSTDateString(yesterday);
        } else if (dateFilter === CUSTOM_DATE && customDate) {
          matchesDate = toKSTDateString(published) === customDate;
        }
      } else if (dateFilter !== ALL_DATE) {
        matchesDate = false;
      }

      return matchesDate;
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
  }, [baseFilteredItems, customDate, dateFilter, isFeatureView, sortOrder]);

  const latestDate = useMemo(() => {
    if (!localTodayMode) return null;
    return items.reduce((max, item) => {
      const d = item.published_at?.slice(0, 10) ?? "";
      return d > max ? d : max;
    }, "");
  }, [localTodayMode, items]);

  // 오늘 탭 전용: 선택 날짜 (기본 = 오늘 = latestDate)
  const todayStr = toKSTDateString(new Date());
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
    const dateFiltered = filteredItems.filter((item) => item.published_at ? toKSTDateString(new Date(item.published_at)) === todaySelectedDate : false);
    // 오늘 기사가 없으면 가장 최근 날짜 기사를 자동 표시 (fallback)
    if (dateFiltered.length === 0 && todaySelectedDate === todayStr) {
      const latestKSTDate = filteredItems.reduce((max, item) => {
        if (!item.published_at) return max;
        const d = toKSTDateString(new Date(item.published_at));
        return d > max ? d : max;
      }, "");
      if (latestKSTDate) {
        return filteredItems.filter((item) => item.published_at ? toKSTDateString(new Date(item.published_at)) === latestKSTDate : false);
      }
    }
    return dateFiltered;
  }, [localTodayMode, todaySelectedDate, todayStr, filteredItems]);

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

  const visibleItems = useMemo(
    () => (localTodayMode ? displayItems : displayItems.slice(0, visibleCount)),
    [displayItems, localTodayMode, visibleCount]
  );

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
    setAutoPlayNextFn(nextItem ? () => playFromIdx(idx + 1) : null);
    playListenable({ text, title: item.title, audioUrl: item.audio_url, slug: item.slug });
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

  function renderCalendarModal() {
    if (!showCalendar) return null;
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr2 = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const selectedValue = showCalendar === "today" ? todaySelectedDate : customDate;
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    function handleSelect(day: number) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (showCalendar === "today") {
        setTodaySelectedDate(dateStr);
      } else {
        setCustomDate(dateStr);
        setDateFilter(CUSTOM_DATE);
      }
      setShowCalendar(null);
    }

    function prevMonth() {
      setCalendarMonth((prev) => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 });
    }
    function nextMonth() {
      setCalendarMonth((prev) => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 });
    }

    const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCalendar(null)}>
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="relative w-full sm:max-w-[400px] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-[20px] pt-[20px] pb-[12px]">
            <button type="button" onClick={prevMonth} className="inline-flex h-[36px] w-[36px] items-center justify-center rounded-full hover:bg-gray-100 transition">
              <ChevronLeft className="h-[20px] w-[20px] text-gray-600" />
            </button>
            <span className="text-[16px] font-bold text-gray-900">{year}년 {month + 1}월</span>
            <button type="button" onClick={nextMonth} className="inline-flex h-[36px] w-[36px] items-center justify-center rounded-full hover:bg-gray-100 transition">
              <ChevronRight className="h-[20px] w-[20px] text-gray-600" />
            </button>
          </div>
          {/* 요일 */}
          <div className="grid grid-cols-7 px-[16px]">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="flex items-center justify-center h-[36px] text-[12px] font-semibold text-gray-400">{wd}</div>
            ))}
          </div>
          {/* 날짜 */}
          <div className="grid grid-cols-7 px-[16px] pb-[20px]">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dateStr === todayStr2;
              const isSelected = dateStr === selectedValue;
              const isFuture = dateStr > todayStr2;
              const hasData = availableDateSet.has(dateStr);
              const isDisabled = isFuture || !hasData;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(day)}
                  className={`flex items-center justify-center h-[44px] rounded-full text-[14px] font-medium transition ${
                    isSelected
                      ? "bg-gray-900 text-white"
                      : isToday
                        ? "bg-orange-50 text-orange-600 font-bold"
                        : isDisabled
                          ? "text-gray-200 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-disabled={isDisabled}
                  title={hasData ? undefined : "해당 날짜에는 콘텐츠가 없습니다."}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {/* 하단 닫기 */}
          <div className="border-t border-gray-100 px-[20px] py-[12px] flex justify-end">
            <button type="button" onClick={() => setShowCalendar(null)} className="text-[14px] font-medium text-gray-500 hover:text-gray-800 transition px-[12px] py-[6px] rounded-lg hover:bg-gray-50">
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="pb-20 sm:pb-12 flex flex-col">
      <p className="text-[10px] text-gray-400 text-center bg-gray-50 py-[4px]" style={{ lineHeight: '14px', margin: '0 -16px' }}>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
      {!isFeatureView && localTodayMode ? (
        <div className="border-b border-gray-200 bg-white text-[14px]" style={{ margin: '0 -16px' }}>
          {/* 날짜 필터 행 */}
          <div className="flex items-center gap-[6px] px-[16px] pt-[10px] pb-[10px] sm:px-[24px]">
            <div className="flex min-w-0 flex-1 items-center gap-[8px]">
              <span style={{ fontSize: 14, fontWeight: 800, color: "#B2570F", letterSpacing: "-0.01em" }}>
                {`${todayStr.slice(5).replace("-", "월 ")}일 · 오늘의 소식`}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-[4px]">
              {/* 검색 아이콘 */}
              <button
                type="button"
                onClick={() => setShowInlineSearch((v) => !v)}
                className={`inline-flex h-[32px] w-[32px] items-center justify-center rounded-full border transition ${
                  showInlineSearch || searchQuery
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
                aria-label="검색"
              >
                <Search className="h-[16px] w-[16px]" />
              </button>
            </div>
          </div>
          {/* 검색 인풋 (토글) */}
          {showInlineSearch ? (
            <div className="flex items-center gap-[6px] px-[16px] pb-[10px] sm:px-[24px]">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-[10px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={draftSearchQuery}
                  onChange={(event) => setDraftSearchQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") setSearchQuery(draftSearchQuery.trim()); }}
                  placeholder="키워드 검색"
                  className="h-[32px] w-full rounded-full border border-gray-200 pl-[30px] pr-[36px] text-[14px] text-gray-800 outline-none transition focus:border-orange-300"
                />
                <SpeechSearchButton
                  onTranscript={(transcript) => { setDraftSearchQuery(transcript); setSearchQuery(transcript.trim()); }}
                  className="absolute right-[4px] top-1/2 min-h-[26px] min-w-[26px] -translate-y-1/2 rounded-full border-0 bg-transparent text-gray-500 hover:bg-gray-100"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery(draftSearchQuery.trim())}
                className="inline-flex h-[32px] shrink-0 items-center justify-center rounded-full bg-gray-900 px-[12px] text-[13px] font-medium text-white transition hover:bg-gray-700"
              >
                검색
              </button>
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
        <div data-search-filter className="border-b border-gray-200 bg-white text-[14px]" style={{ margin: '0 -16px' }}>
          {/* 날짜 필터 행 */}
          <div className="flex items-center gap-[6px] px-[16px] pt-[10px] pb-[10px] sm:px-[24px]">
            <div className="flex min-w-0 flex-1 items-center gap-[6px] overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            <button
              type="button"
              onClick={() => { setCalendarMonth({ year: new Date().getFullYear(), month: new Date().getMonth() }); setShowCalendar("normal"); }}
              className={`inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full border transition ${
                dateFilter === CUSTOM_DATE
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <CalendarDays className="h-[16px] w-[16px]" />
            </button>
            {dateFilter === CUSTOM_DATE && customDate ? (
              <span className="inline-flex h-[32px] shrink-0 items-center gap-1 rounded-full border border-gray-900 bg-gray-900 pl-[10px] pr-[6px] text-[13px] font-medium text-white">
                {customDate.slice(5).replace("-", "/")}
                <button
                  type="button"
                  onClick={() => { setCustomDate(""); setDateFilter(ALL_DATE); }}
                  className="inline-flex h-[20px] w-[20px] items-center justify-center rounded-full text-white/70 transition hover:bg-white/20 hover:text-white"
                >
                  ✕
                </button>
              </span>
            ) : null}
            {[
              { key: TODAY_DATE, label: "오늘" },
              { key: YESTERDAY_DATE, label: "어제" },
              { key: ALL_DATE, label: "전체" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => { setDateFilter(option.key); setCustomDate(""); }}
                className={`inline-flex h-[32px] shrink-0 items-center whitespace-nowrap rounded-full border px-[14px] text-[14px] font-medium transition ${
                  dateFilter === option.key
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
            </div>
            <div className="flex shrink-0 items-center gap-[4px]">
              <button
                type="button"
                onClick={() => setShowInlineSearch((v) => !v)}
                className={`inline-flex h-[32px] w-[32px] items-center justify-center rounded-full border transition ${
                  showInlineSearch || searchQuery
                    ? "border-gray-900 bg-gray-900 text-white"
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
                      ? "border-gray-900 bg-gray-900 text-white"
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
            <div className="flex items-center gap-[6px] px-[16px] pb-[10px] sm:px-[24px]">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-[10px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={draftSearchQuery}
                  onChange={(event) => setDraftSearchQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") setSearchQuery(draftSearchQuery.trim()); }}
                  placeholder="키워드 검색"
                  className="h-[32px] w-full rounded-full border border-gray-200 pl-[30px] pr-[36px] text-[14px] text-gray-800 outline-none transition focus:border-orange-300"
                />
                <SpeechSearchButton
                  onTranscript={(transcript) => { setDraftSearchQuery(transcript); setSearchQuery(transcript.trim()); }}
                  className="absolute right-[4px] top-1/2 min-h-[26px] min-w-[26px] -translate-y-1/2 rounded-full border-0 bg-transparent text-gray-500 hover:bg-gray-100"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery(draftSearchQuery.trim())}
                className="inline-flex h-[32px] shrink-0 items-center justify-center rounded-full bg-gray-900 px-[12px] text-[13px] font-medium text-white transition hover:bg-gray-700"
              >
                검색
              </button>
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

      {/* 카테고리 필터 (xl+ 에서는 좌측 사이드바로 대체) */}
      {!isFeatureView ? (
        <div className="flex items-center gap-[6px] overflow-x-auto [&::-webkit-scrollbar]:hidden mt-[12px] xl:hidden" style={{ scrollbarWidth: "none" }}>
          {[ALL_TOPICS, ...mainInterests].map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => { setSelectedTopic(topic); setDraftTopic(topic); setSelectedSubtopic(ALL_SUBTOPICS); }}
              className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-medium transition ${
                selectedTopic === topic
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
              style={{ height: '2rem', paddingLeft: '0.875rem', paddingRight: '0.875rem', fontSize: '0.875rem' }}
            >
              {topic === ALL_TOPICS ? "전체" : (interestLabels[topic] ?? topic)}
            </button>
          ))}
        </div>
      ) : null}

      {visibleSubtopics.length > 0 ? (
        <div className="flex flex-wrap gap-[4px] pt-[2px] mt-[8px]">
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
              className={`whitespace-nowrap rounded-full font-medium transition ${
                selectedSubtopic === subtopic ? "bg-orange-100 text-orange-700 border border-orange-300" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              style={{ height: '1.625rem', paddingLeft: '0.625rem', paddingRight: '0.625rem', fontSize: '0.75rem' }}
            >
              {subtopic}
            </button>
          ))}
        </div>
      ) : null}

      {selectedSlugs.length > 0 ? (
        <div className="fixed bottom-[34px] left-1/2 z-40 -translate-x-1/2 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-[8px] rounded-full border border-gray-300 bg-white pl-[16px] pr-[8px] py-[8px] shadow-[0_8px_40px_rgba(17,32,51,0.18)]">
            <span className="whitespace-nowrap text-[14px] font-semibold text-gray-900">{selectedSlugs.length}개 선택</span>
            <div className="h-[20px] w-px bg-gray-300" />
            <ListenButton
              text={selectedListenText}
              speechTitle={`${selectedSlugs.length}개 선택`}
              segments={selectedSegments}
              label="듣기"
              mobileIconOnly
              className="h-[36px] w-[36px] sm:w-auto sm:px-[12px] !border-gray-300 !bg-white !text-gray-700 hover:!bg-gray-50 !text-[13px]"
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
              className="inline-flex h-[36px] w-[36px] items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
              aria-label="선택 해제"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}


      <div className="grid gap-[12px] mt-[12px]">
        {displayItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center md:px-8 md:py-14">
            <p className="text-lg font-bold text-gray-900 md:text-xl">{localTodayMode ? "오늘뉴스가 아직 등록되지 않았습니다." : "검색 결과가 없습니다."}</p>
            <p className="mt-3 text-sm leading-7 text-gray-600 md:text-base">
              {localTodayMode ? "잠시 후 다시 확인해보세요." : "다른 검색어를 입력하거나 카테고리와 날짜 범위를 다시 선택해보세요."}
            </p>
          </div>
        ) : null}
        {visibleItems.map((item, idx) => {
          // 상품 그리드 삽입: 5번째 뒤 + 10번째(또는 마지막) 뒤
          const isLastItem = idx === visibleItems.length - 1;
          const showFirstSlot = idx === 4 || (isLastItem && idx < 4);
          const showSecondSlot = !showFirstSlot && (idx === 9 || (isLastItem && idx >= 4 && idx < 9));
          // 선택된 카테고리 또는 기사의 카테고리에 맞는 상품 선택
          const feedProducts = selectedTopic !== ALL_TOPICS
            ? (feedProductMap[selectedTopic] ?? [])
            : (feedProductMap[item.main_interest] ?? feedProductMap[mainInterests[0]] ?? []);
          const feedSlice = showFirstSlot ? feedProducts.slice(0, 5) : showSecondSlot ? feedProducts.slice(0, 5) : [];
          const hasFeedProducts = feedSlice.length > 0;

          return (
            <div key={item.id}>
              <article
                data-archive-item
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  border: "1.5px solid #F2E6D7",
                  padding: 18,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                {/* 상단: 체크박스 + 카테고리 배지 + 날짜 */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  <input
                    type="checkbox"
                    checked={selectedSlugs.includes(item.slug)}
                    onChange={() => toggleSlug(item.slug)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 18, height: 18, accentColor: "#E57C23", flexShrink: 0 }}
                  />
                  {(() => {
                    const m = seniorCategoryMeta(item.main_interest);
                    return (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          borderRadius: 999,
                          background: m.bg,
                          color: m.color,
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        <span style={{ fontSize: 15 }}>{m.emoji}</span>
                        {interestLabels[item.main_interest] ?? item.main_interest}
                        {item.sub_interest ? ` · ${item.sub_interest}` : ""}
                      </span>
                    );
                  })()}
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#9C907F", fontWeight: 600 }}>
                    {item.published_at ? formatDate(item.published_at) : "발행 전"}
                  </span>
                </div>

                {/* 본문 */}
                <Link href={`/archive/${item.slug}`} className="group block" style={{ textDecoration: "none", color: "inherit" }}>
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
                      <p
                        style={{
                          margin: 0,
                          fontSize: "calc(15px * var(--font-scale, 1))",
                          lineHeight: 1.6,
                          color: "#4A4037",
                          fontWeight: 500,
                        }}
                      >
                        {item.short_summary}
                      </p>
                    </div>
                    {item.thumbnail_url ? (
                      <ContentThumbnail
                        src={item.thumbnail_url}
                        alt={item.thumbnail_alt?.trim() || item.title}
                        className="w-24 h-24 shrink-0 overflow-hidden rounded-xl md:w-28 md:h-28"
                        imgClassName="w-full h-full object-cover"
                        fallbackLabel="준비 중"
                      />
                    ) : (
                      <CategoryPlaceholder cat={item.main_interest} size={96} />
                    )}
                  </div>
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

                {/* 하단: 액션 버튼 */}
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
                    text={[item.title, item.short_summary, item.action_line].filter(Boolean).join(". ")}
                    speechTitle={item.title}
                    className="!h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[13px] !font-semibold !text-[#7A6F62] hover:!text-[#1F1A14] !shadow-none"
                    label="듣기"
                    onPlay={() => handleCardPlay(idx)}
                    audioUrl={item.audio_url}
                    trackSlug={item.slug}
                  />
                  <CompleteShareButton
                    shareSlugs={[item.slug]}
                    interestSummary={item.title}
                    buttonLabel="공유"
                    triggerClassName="!h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[13px] !font-semibold !text-[#7A6F62] hover:!text-[#1F1A14] !shadow-none"
                    modalTitle="이 소식을 공유해보세요."
                  />
                  <div className="flex-1" />
                  {(item.view_count ?? 0) > 0 ? (
                    <span style={{ fontSize: 12, color: "#9C907F", fontWeight: 600 }}>{(item.view_count ?? 0).toLocaleString()} 조회</span>
                  ) : null}
                  <FavoriteToggleButton
                    slug={item.slug}
                    contentItemId={item.id}
                    initialFavorite={resolvedFavoriteIds.includes(item.slug)}
                    label="저장"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#7A6F62] hover:text-[#1F1A14] transition"
                  />
                </div>
              </article>
              {hasFeedProducts ? (
                <section className="pt-4 pb-2">
                  <p className="text-xs text-gray-400 mb-3">이 기사와 관련된 상품</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {feedSlice.slice(0, 5).map((product, idx) => {
                      const price = product.price != null ? new Intl.NumberFormat("ko-KR").format(product.price) : null;
                      const hideClass = idx >= 4 ? "hidden lg:block" : idx >= 3 ? "hidden sm:block" : "";
                      return (
                        <a
                          key={product.id}
                          href={product.linkUrl}
                          target="_blank"
                          rel="noopener sponsored"
                          className={`block transition hover:opacity-80 ${hideClass}`}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                            {product.imageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">상품 이미지</div>
                            )}
                          </div>
                          <p className="text-xs font-medium line-clamp-2 leading-tight text-gray-900">{product.title}</p>
                          {price ? (
                            <p className="text-xs text-orange-600 font-bold mt-1">{price}원</p>
                          ) : null}
                        </a>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </div>
          );
        })}
      </div>

      {!localTodayMode && visibleCount < displayItems.length && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          <span className="text-sm text-gray-400">더 불러오는 중...</span>
        </div>
      )}

      {showLoginPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-5 py-8">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-gray-200 md:p-8">
            <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">공유 안내</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-gray-900">로그인 후 공유하실 수 있어요.</h2>
            <p className="mt-4 text-base leading-7 text-gray-700">내 프로필 정보와 함께 공유되기 때문에 먼저 로그인해 주세요.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-base font-semibold text-white"
              >
                로그인하기
              </button>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-900"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {renderCalendarModal()}
    </div>
  );
}
