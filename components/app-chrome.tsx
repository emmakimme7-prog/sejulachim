"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";

import { SpeechPlayer, stopSpeech } from "@/components/speech-controls";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function NavigationStopper() {
  const pathname = usePathname();
  useEffect(() => {
    // 라우트 이동 시 재생 중인 오디오/음성 정지 (listen 버튼별 cleanup 만으로는
    // 동적 세그먼트 재사용 시 놓치는 경우가 있어 글로벌 안전망 추가).
    stopSpeech();
  }, [pathname]);
  return null;
}

export function AppChrome({ slot }: { slot: "top" | "bottom" }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/dashboard");

  if (isAdminRoute) {
    return null;
  }

  if (slot === "top") {
    return (
      <>
        <NavigationStopper />
        <Suspense fallback={null}>
          <SiteHeader />
        </Suspense>
        {/* fixed 헤더 높이 보정 spacer: 모바일(로고행 69px + 탭행 ~49px) / 데스크탑(로고행 69px + 하단 border 1px) */}
        <div className="h-[115px] lg:h-[70px] shrink-0" aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      <SpeechPlayer />
      <SiteFooter />
    </>
  );
}
