"use client";

import type { FormEvent, MouseEvent } from "react";

import { Bell, LibraryBig, Search, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SpeechSearchButton } from "@/components/speech-controls";
import { fontSizeOptions, useFontSize } from "@/components/font-size-provider";

function FontSizePills() {
  const { fontSize, setFontSize } = useFontSize();
  const sizes: { value: typeof fontSize; size: number }[] = [
    { value: "small", size: 13 },
    { value: "medium", size: 16 },
    { value: "large", size: 19 },
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#F5EEE2",
        borderRadius: 999,
        padding: 3,
        gap: 2,
      }}
    >
      {sizes.map((opt) => {
        const active = fontSize === opt.value;
        const label = fontSizeOptions.find((o) => o.value === opt.value)?.label ?? "";
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFontSize(opt.value)}
            aria-label={`${label} 글씨 크기`}
            aria-pressed={active}
            style={{
              minWidth: 32,
              height: 30,
              padding: "0 8px",
              border: "none",
              borderRadius: 999,
              background: active ? "#1F1A14" : "transparent",
              color: active ? "#fff" : "#4A4037",
              fontWeight: active ? 900 : 700,
              fontSize: opt.size,
              letterSpacing: "-0.02em",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
          >
            가
          </button>
        );
      })}
    </div>
  );
}

type SessionPayload = {
  session: {
    id: string;
    email: string;
    hasPassword: boolean;
  } | null;
  unreadCount: number;
};

export function SiteHeader() {
  const [payload, setPayload] = useState<SessionPayload>({ session: null, unreadCount: 0 });
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolledDown, setScrolledDown] = useState(false);
  const lastScrollYRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store"
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setPayload({
            session: data.session ?? null,
            unreadCount: Number(data.unreadCount ?? 0)
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPayload({ session: null, unreadCount: 0 });
        }
      })
      .finally(() => {
        if (!cancelled) setSessionLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      if (window.innerWidth >= 1024) {
        setScrolledDown(false);
        return;
      }
      const y = window.scrollY;
      if (y > lastScrollYRef.current && y > 60) {
        setScrolledDown(true);
      } else if (y < lastScrollYRef.current) {
        setScrolledDown(false);
      }
      lastScrollYRef.current = y;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // shallow-nav 후에도 즉시 반영되도록 로컬 상태로 관리
  const [localCategory, setLocalCategory] = useState(searchParams.get("category")?.trim() ?? "");
  const [localView, setLocalView] = useState(searchParams.get("view")?.trim() ?? "");
  const [localQuery, setLocalQuery] = useState(searchParams.get("q")?.trim() ?? "");

  // Next.js 라우팅으로 URL이 바뀌면 동기화
  useEffect(() => {
    setLocalCategory(searchParams.get("category")?.trim() ?? "");
    setLocalView(searchParams.get("view")?.trim() ?? "");
    setLocalQuery(searchParams.get("q")?.trim() ?? "");
  }, [searchParams]);

  // 브라우저 뒤로/앞으로 버튼 시 즉시 갱신
  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      setLocalCategory(params.get("category")?.trim() ?? "");
      setLocalView(params.get("view")?.trim() ?? "");
      setLocalQuery(params.get("q")?.trim() ?? "");
    }
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  const currentCategory = localCategory;
  const currentQuery = localQuery;
  const currentView = localView;
  const isIntroActive = currentView === "intro";
  const isTodayActive = currentView === "today";
  const isArchiveActive = currentView === "archive";
  const isPopularActive = !currentCategory && !currentQuery && !isTodayActive && !isIntroActive && !isArchiveActive;
  const isLoggedIn = !!payload.session;
  const targetHref = "/";

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && showSearch) {
        setShowSearch(false);
      }
    }
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (!showSearch) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-search-panel]") || target.closest("[data-search-toggle]")) return;
      setShowSearch(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearch]);

  function handleLogoClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    // 비로그인 유저는 소개 탭으로 이동
    if (!isLoggedIn && sessionLoaded) {
      router.push("/?view=intro");
      return;
    }

    if (pathname === targetHref && !searchParams.toString()) {
      window.location.assign(targetHref);
      return;
    }

    router.push(targetHref);
  }

  function handleHeaderSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
    setShowSearch(false);
  }

  return (
    <header
      data-site-header
      className="fixed top-0 left-0 right-0 z-30 border-b border-gray-200 bg-white transition-transform duration-200"
      style={{ transform: scrolledDown ? "translateY(-69px)" : "translateY(0)" }}
    >
      <div className="gnb-inner">

        {/* 로고 + 액션 행 */}
        <div>
          <div className="flex h-[69px] items-center justify-between gap-[17px]">
            {/* 로고 */}
            <Link
              href={targetHref}
              onClick={handleLogoClick}
              className="flex items-center gap-[10px]"
              aria-label="세줄아침 홈으로 이동"
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: "#E57C23",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 20,
                  letterSpacing: "-0.02em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                세
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#1F1A14",
                  letterSpacing: "-0.03em",
                }}
                className="hidden sm:block"
              >
                세줄아침
              </div>
            </Link>

            {/* 데스크탑 탭 (pill 스타일) */}
            <nav className="hidden lg:flex items-center gap-[4px]">
              {!isLoggedIn && sessionLoaded ? (
                <button
                  type="button"
                  onClick={() => router.push("/?view=intro")}
                  className="inline-flex items-center whitespace-nowrap"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    background: isIntroActive ? "#FFF2E3" : "transparent",
                    color: isIntroActive ? "#B2570F" : "#4A4037",
                    fontSize: 16,
                    fontWeight: isIntroActive ? 900 : 800,
                    letterSpacing: "-0.01em",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  소개
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => router.push("/?view=today")}
                className="inline-flex items-center whitespace-nowrap"
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: isTodayActive ? "#FFF2E3" : "transparent",
                  color: isTodayActive ? "#B2570F" : "#4A4037",
                  fontSize: 16,
                  fontWeight: isTodayActive ? 900 : 800,
                  letterSpacing: "-0.01em",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                오늘 소식
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center whitespace-nowrap"
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: isPopularActive ? "#FFF2E3" : "transparent",
                  color: isPopularActive ? "#B2570F" : "#4A4037",
                  fontSize: 16,
                  fontWeight: isPopularActive ? 900 : 800,
                  letterSpacing: "-0.01em",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                인기 소식
              </button>
              <button
                type="button"
                onClick={() => router.push("/?view=archive")}
                className="inline-flex items-center whitespace-nowrap"
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: isArchiveActive ? "#FFF2E3" : "transparent",
                  color: isArchiveActive ? "#B2570F" : "#4A4037",
                  fontSize: 16,
                  fontWeight: isArchiveActive ? 900 : 800,
                  letterSpacing: "-0.01em",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                지난 소식
              </button>
            </nav>

            {/* 인라인 검색 (lg 이상) */}
            <form
              onSubmit={handleHeaderSearchSubmit}
              className="hidden lg:flex relative"
              style={{ flex: "0 1 320px", marginLeft: "auto", marginRight: 12 }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  display: "flex",
                }}
              >
                <Search style={{ width: 18, height: 18, color: "#9C907F" }} />
              </div>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="지난 소식 검색"
                style={{
                  width: "100%",
                  height: 40,
                  paddingLeft: 42,
                  paddingRight: 16,
                  borderRadius: 999,
                  border: "1.5px solid #E8DCC7",
                  background: "#FFFBF5",
                  fontSize: 14,
                  color: "#1F1A14",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </form>

            {/* 우측 액션 버튼 */}
            <div className="flex items-center gap-[6px] sm:gap-[10px]">
              <div className="hidden lg:block">
                <FontSizePills />
              </div>
              <button
                data-search-toggle
                type="button"
                onClick={() => setShowSearch((current) => !current)}
                className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 lg:hidden"
                aria-label="검색 열기"
              >
                <Search className="h-[22px] w-[22px]" />
              </button>
              {!sessionLoaded ? (
                <div className="flex items-center gap-[6px] sm:gap-[12px]">
                  <div className="h-[40px] w-[40px] animate-pulse rounded-full bg-gray-100" />
                  <div className="h-[40px] w-[40px] animate-pulse rounded-full bg-gray-100" />
                  <div className="hidden sm:block h-[40px] w-[40px] animate-pulse rounded-full bg-gray-100" />
                </div>
              ) : payload.session ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative inline-flex h-[40px] w-[40px] items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
                    aria-label="알림"
                  >
                    <Bell className="h-[22px] w-[22px]" />
                    {payload.unreadCount > 0 ? (
                      <span className="absolute right-[6px] top-[6px] h-[11px] w-[11px] rounded-full bg-red-500" />
                    ) : null}
                  </Link>
                  <Link
                    href="/library"
                    className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
                    aria-label="내 서재"
                  >
                    <LibraryBig className="h-[22px] w-[22px]" />
                  </Link>
                  <Link
                    href="/account"
                    className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
                    aria-label="프로필"
                  >
                    <User className="h-[22px] w-[22px]" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex min-h-[36px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-[14px] text-[15px] font-bold text-gray-700 transition hover:bg-gray-100 sm:min-h-[40px] sm:px-[20px] sm:text-[16px]"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    style={{ boxShadow: "0 4px 10px rgba(229,124,35,0.28)" }}
                    className="inline-flex min-h-[36px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#E57C23] px-[16px] text-[15px] font-extrabold tracking-[-0.01em] text-white transition hover:bg-[#D16612] sm:min-h-[44px] sm:px-[22px] sm:text-[16px]"
                  >
                    무료 구독 시작
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 모바일 탭 */}
        <div className="flex border-t border-gray-100 lg:hidden">
          {!isLoggedIn && sessionLoaded ? (
            <button
              type="button"
              onClick={() => router.push("/?view=intro")}
              className={`relative flex-1 inline-flex items-center justify-center min-h-[44px] text-[15px] font-extrabold tracking-[-0.01em] transition-colors ${isIntroActive ? "text-[#B2570F]" : "text-gray-600"}`}
            >
              소개
              {isIntroActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E57C23]" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => router.push("/?view=today")}
            className={`relative flex-1 inline-flex items-center justify-center min-h-[44px] text-[15px] font-extrabold tracking-[-0.01em] transition-colors ${isTodayActive ? "text-[#B2570F]" : "text-gray-600"}`}
          >
            오늘 소식
            {isTodayActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E57C23]" />}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className={`relative flex-1 inline-flex items-center justify-center min-h-[44px] text-[15px] font-extrabold tracking-[-0.01em] transition-colors ${isPopularActive ? "text-[#B2570F]" : "text-gray-600"}`}
          >
            인기 소식
            {isPopularActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E57C23]" />}
          </button>
          <button
            type="button"
            onClick={() => router.push("/?view=archive")}
            className={`relative flex-1 inline-flex items-center justify-center min-h-[44px] text-[15px] font-extrabold tracking-[-0.01em] transition-colors ${isArchiveActive ? "text-[#B2570F]" : "text-gray-600"}`}
          >
            지난 소식
            {isArchiveActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E57C23]" />}
          </button>
        </div>

      </div>

      {showSearch ? (
        <div data-search-panel className="relative z-40 border-t border-gray-100 bg-white px-[16px] pb-[10px] pt-[10px] sm:px-[24px]">
          <form onSubmit={handleHeaderSearchSubmit} className="mx-auto flex max-w-[1536px] items-center gap-[8px]">
            <div className="relative min-w-0 flex-1">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="지난 소식 검색"
                className="h-[40px] w-full rounded-full border border-gray-200 pl-[16px] pr-[50px] text-[14px] text-gray-800 outline-none transition focus:border-orange-400"
              />
              <SpeechSearchButton
                onTranscript={(transcript) => setSearchQuery(transcript)}
                className="absolute right-[4px] top-1/2 min-h-[32px] min-w-[32px] -translate-y-1/2 rounded-full border-0 bg-transparent text-gray-600 hover:bg-gray-100"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-[40px] shrink-0 items-center justify-center rounded-full bg-gray-900 px-[16px] text-[14px] font-semibold text-white transition hover:bg-gray-800"
            >
              검색
            </button>
          </form>
        </div>
      ) : null}
    </header>
  );
}
