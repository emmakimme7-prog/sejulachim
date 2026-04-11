"use client";

import type { FormEvent, MouseEvent } from "react";

import { Bell, CalendarDays, Flame, Info, LibraryBig, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SpeechSearchButton } from "@/components/speech-controls";
import { MAIN_INTERESTS } from "@/lib/content/sub-interests";
import { cn } from "@/lib/utils";

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

  const currentCategory = searchParams.get("category")?.trim() ?? "";
  const currentQuery = searchParams.get("q")?.trim() ?? "";
  const currentView = searchParams.get("view")?.trim() ?? "";
  const isIntroActive = currentView === "intro";
  const isTodayActive = currentView === "today";
  const isPopularActive = !currentCategory && !currentQuery && !isTodayActive && !isIntroActive;
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

  function shallowNav(url: string) {
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event("shallow-nav"));
  }

  function handleLogoClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname === targetHref && !searchParams.toString()) {
      event.preventDefault();
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
              className="flex items-center gap-[12px]"
              aria-label="세줄아침 홈으로 이동"
            >
              <Image src="/threeline_morning_logo_v2.png" alt="세줄아침" width={180} height={46} className="h-[32px] w-auto sm:h-[40px]" />
            </Link>

            {/* 데스크탑 카테고리 탭 */}
            <nav className="hidden lg:flex items-center gap-[6px]">
              {!isLoggedIn && sessionLoaded ? (
                <button
                  type="button"
                  onClick={() => { if (pathname === "/") shallowNav("/?view=intro"); else router.push("/?view=intro"); }}
                  className={`relative px-[23px] py-[12px] text-[20px] font-medium transition-colors ${isIntroActive ? "text-orange-500" : "text-gray-600 hover:text-gray-900"}`}
                >
                  소개
                  {isIntroActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => { if (pathname === "/") shallowNav("/"); else router.push("/"); }}
                className={`relative px-[23px] py-[12px] text-[20px] font-medium transition-colors ${isPopularActive ? "text-orange-500" : "text-gray-600 hover:text-gray-900"}`}
              >
                인기
                {isPopularActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
              </button>
              <button
                type="button"
                onClick={() => { if (pathname === "/") shallowNav("/?view=today"); else router.push("/?view=today"); }}
                className={`relative px-[23px] py-[12px] text-[20px] font-medium transition-colors ${isTodayActive ? "text-orange-500" : "text-gray-600 hover:text-gray-900"}`}
              >
                오늘
                {isTodayActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
              </button>
              {MAIN_INTERESTS.map((category) => {
                const active = currentCategory === category;
                const url = `/?category=${encodeURIComponent(category)}`;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => { if (pathname === "/") shallowNav(url); else router.push(url); }}
                    className={`relative px-[23px] py-[12px] text-[20px] font-medium transition-colors ${active ? "text-orange-500" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {category}
                    {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
                  </button>
                );
              })}
            </nav>

            {/* 우측 액션 버튼 */}
            <div className="flex items-center gap-[6px] sm:gap-[12px]">
              <button
                data-search-toggle
                type="button"
                onClick={() => setShowSearch((current) => !current)}
                className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
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
                    className="inline-flex min-h-[36px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-[14px] text-[15px] font-semibold text-gray-700 transition hover:bg-gray-100 sm:min-h-[40px] sm:px-[23px] sm:text-[20px]"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex min-h-[36px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-orange-500 px-[14px] text-[15px] font-semibold text-white transition hover:bg-orange-600 sm:min-h-[40px] sm:px-[23px] sm:text-[20px]"
                  >
                    무료신청
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 모바일 카테고리 탭 */}
        <div className="flex overflow-x-auto border-t border-gray-100 lg:hidden [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {!isLoggedIn && sessionLoaded ? (
            <button
              type="button"
              onClick={() => { if (pathname === "/") shallowNav("/?view=intro"); else router.push("/?view=intro"); }}
              className={`relative shrink-0 inline-flex items-center justify-center min-w-[48px] min-h-[48px] px-[14px] transition-colors ${isIntroActive ? "text-orange-500" : "text-gray-600"}`}
              aria-label="소개"
            >
              <Info className="h-[22px] w-[22px]" />
              {isIntroActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => { if (pathname === "/") shallowNav("/"); else router.push("/"); }}
            className={`relative shrink-0 inline-flex items-center justify-center min-w-[48px] min-h-[48px] px-[14px] transition-colors ${isPopularActive ? "text-orange-500" : "text-gray-600"}`}
            aria-label="인기"
          >
            <Flame className="h-[22px] w-[22px]" />
            {isPopularActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
          </button>
          <button
            type="button"
            onClick={() => { if (pathname === "/") shallowNav("/?view=today"); else router.push("/?view=today"); }}
            className={`relative shrink-0 inline-flex items-center justify-center min-w-[48px] min-h-[48px] px-[14px] transition-colors ${isTodayActive ? "text-orange-500" : "text-gray-600"}`}
            aria-label="오늘"
          >
            <CalendarDays className="h-[22px] w-[22px]" />
            {isTodayActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
          </button>
          {MAIN_INTERESTS.map((category) => {
            const active = currentCategory === category;
            const url = `/?category=${encodeURIComponent(category)}`;
            return (
              <button
                key={category}
                type="button"
                onClick={() => { if (pathname === "/") shallowNav(url); else router.push(url); }}
                className={`relative shrink-0 min-h-[48px] px-[18px] text-[20px] font-medium whitespace-nowrap transition-colors ${active ? "text-orange-500" : "text-gray-600"}`}
              >
                {category}
                {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
              </button>
            );
          })}
        </div>

      </div>

      {showSearch ? (
        <div data-search-panel className="relative z-40 border-t border-navy-100 bg-white px-[23px] pb-[17px] pt-[17px]">
          <form onSubmit={handleHeaderSearchSubmit} className="mx-auto flex max-w-[1536px] items-center gap-[12px]">
            <div className="relative min-w-0 flex-1">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="지난 소식 검색"
                className="h-[63px] w-full rounded-full border border-navy-200 pl-[23px] pr-[69px] text-[20px] text-navy-800 outline-none transition focus:border-orange-300"
              />
              <SpeechSearchButton
                onTranscript={(transcript) => setSearchQuery(transcript)}
                className="absolute right-[6px] top-1/2 min-h-[40px] min-w-[40px] -translate-y-1/2 rounded-full border-0 bg-transparent text-navy-700 hover:bg-navy-50"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-[63px] shrink-0 items-center justify-center rounded-full bg-navy-900 px-[23px] text-[20px] font-semibold text-white transition hover:bg-navy-700"
            >
              검색
            </button>
          </form>
        </div>
      ) : null}
    </header>
  );
}
