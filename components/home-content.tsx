"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { LandingHero } from "@/components/landing-hero";
import { fetchSessionCached } from "@/lib/auth/session-client";

type PreviewItem = {
  category: string;
  title: string;
  slug: string;
  short_summary?: string;
  action_line?: string;
  audio_url?: string;
};

export function HomeContent({
  children,
  previews,
}: {
  children: React.ReactNode;
  previews: PreviewItem[];
}) {
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  // hero 표시 조건 — 어느 하나 true 면 표시:
  //   1. ?view=intro 명시적 진입 (광고 / 외부 링크에서 hero 강제 보여줄 때)
  //   2. 검색/카테고리/뷰 필터 없는 깨끗한 / 진입 (신규 방문자)
  //
  // 이전: ?view=intro 가 있어야만 hero 보였음 → /로 직접 들어온 신규 방문자는 헤더 아래 글 리스트만 봐서
  // 사이트 가치 인지 어려웠음 (bounce ↑). 깨끗한 / 진입자에게도 hero 노출하도록 변경.
  const heroVisible = useMemo(() => {
    const view = searchParams.get("view");
    if (view === "intro") return true;
    if (view === "archive" || view === "today") return false;
    const hasFilter =
      !!searchParams.get("q") ||
      !!searchParams.get("category") ||
      !!searchParams.get("mode");
    return !hasFilter;
  }, [searchParams]);

  useEffect(() => {
    // session 조회는 페이지 내 4개 컴포넌트에서 동시 호출되던 이슈 (QA 에서 11회+ polling 발견).
    // module-level cache 로 첫 fetch 만 실제 호출, 나머지는 동일 Promise share.
    let cancelled = false;
    fetchSessionCached()
      .then((data) => {
        if (!cancelled) setIsLoggedIn(!!data?.session);
      })
      .catch(() => {
        if (!cancelled) setIsLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showHero = isLoggedIn === false && heroVisible;

  // 소개 페이지에서 푸터 margin-top 제거
  useEffect(() => {
    if (showHero) {
      document.body.classList.add("hero-active");
    } else {
      document.body.classList.remove("hero-active");
    }
    return () => document.body.classList.remove("hero-active");
  }, [showHero]);

  // 로딩 중에는 아무것도 안 보여줌 (깜빡임 방지)
  if (isLoggedIn === null) {
    return <div className="min-h-[60vh]" />;
  }

  // 비로그인 + 메인(필터 없음)에서만 랜딩 히어로 표시
  if (showHero) {
    return <LandingHero previews={previews} />;
  }

  return <>{children}</>;
}
