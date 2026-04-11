"use client";

import { useCallback, useEffect, useState } from "react";

import { LandingHero } from "@/components/landing-hero";

type PreviewItem = { category: string; title: string; slug: string };

function checkHeroUrl() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "intro";
}

export function HomeContent({
  children,
  previews,
}: {
  children: React.ReactNode;
  previews: PreviewItem[];
}) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [heroVisible, setHeroVisible] = useState(true);

  const syncHero = useCallback(() => setHeroVisible(checkHeroUrl()), []);

  useEffect(() => {
    // 초기 URL 체크
    syncHero();

    fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIsLoggedIn(!!data?.session))
      .catch(() => setIsLoggedIn(false));
  }, [syncHero]);

  // shallowNav(pushState)에 반응하여 히어로 표시 여부 갱신
  useEffect(() => {
    window.addEventListener("popstate", syncHero);
    const origPushState = history.pushState.bind(history);
    history.pushState = (...args) => { origPushState(...args); syncHero(); };
    return () => {
      window.removeEventListener("popstate", syncHero);
      history.pushState = origPushState;
    };
  }, [syncHero]);

  // 로딩 중에는 아무것도 안 보여줌 (깜빡임 방지)
  if (isLoggedIn === null) {
    return <div className="min-h-[60vh]" />;
  }

  // 비로그인 + 메인(필터 없음)에서만 랜딩 히어로 표시
  if (!isLoggedIn && heroVisible) {
    return <LandingHero previews={previews} />;
  }

  return <>{children}</>;
}
