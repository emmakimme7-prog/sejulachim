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
      <ChatHubInquiryWidget />
    </>
  );
}
