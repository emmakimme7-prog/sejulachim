"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { SpeechPlayer } from "@/components/speech-controls";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function AppChrome({ slot }: { slot: "top" | "bottom" }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/dashboard");

  if (isAdminRoute) {
    return null;
  }

  if (slot === "top") {
    return (
      <>
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
