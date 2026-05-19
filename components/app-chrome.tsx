"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";

import { ChatHubInquiryWidget } from "@/components/chathub-inquiry-widget";
import { SpeechPlayer, stopSpeech, isChainAdvancing, consumeChainAdvance } from "@/components/speech-controls";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function NavigationStopper() {
  const pathname = usePathname();
  useEffect(() => {
    // chain 에 의한 이동이면 한 번만 무시(토큰 소비), 사용자 수동 이동이면 정지.
    // 이렇게 해야 chain 직후(900ms 안) 사용자가 다른 페이지로 이동해도 정상적으로 멈춘다.
    if (isChainAdvancing()) {
      consumeChainAdvance();
      return;
    }
    stopSpeech();
  }, [pathname]);
  return null;
}

export function AppChrome({ slot }: { slot: "top" | "bottom" }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/dashboard");
  // 홈(`/`)에만 모바일 피드 탭행이 있어 헤더가 더 높다(site-header의 isHome과 동일 기준).
  const isHome = pathname === "/";

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
        {/* fixed 헤더 높이 보정 spacer: 홈은 모바일에 피드 탭행(~46px)이 추가돼 115px,
            그 외 라우트(서재·마이페이지·상세 등)는 탭행이 없어 로고행만 70px */}
        <div className={isHome ? "h-[115px] lg:h-[70px] shrink-0" : "h-[70px] shrink-0"} aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      <SpeechPlayer />
      <SiteFooter />
      <ChatHubInquiryWidget />
    </>
  );
}
