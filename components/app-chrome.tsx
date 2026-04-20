"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";

import { SpeechPlayer, stopSpeech, isChainAdvancing } from "@/components/speech-controls";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function NavigationStopper() {
  const pathname = usePathname();
  useEffect(() => {
    // chain 에 의한 이동이면 재생 유지, 사용자 수동 이동이면 정지.
    if (isChainAdvancing()) return;
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
