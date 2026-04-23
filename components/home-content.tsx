"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { LandingHero } from "@/components/landing-hero";

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
  const heroVisible = useMemo(() => searchParams.get("view") === "intro", [searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIsLoggedIn(!!data?.session))
      .catch((error: unknown) => {
        if ((error as { name?: string } | undefined)?.name !== "AbortError") {
          setIsLoggedIn(false);
        }
      });

    return () => controller.abort();
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
