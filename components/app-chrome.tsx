"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { FontSizeToggle } from "@/components/font-size-toggle";
import { getSpeechSnapshot, SpeechPlayer, subscribeSpeechState } from "@/components/speech-controls";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function AppChrome({ slot }: { slot: "top" | "bottom" }) {
  const pathname = usePathname();
  const [footerLift, setFooterLift] = useState(0);
  const [speechActive, setSpeechActive] = useState(false);
  const isAdminRoute = pathname.startsWith("/dashboard");

  useEffect(() => {
    const unsub = subscribeSpeechState(() => setSpeechActive(getSpeechSnapshot().active));
    return unsub;
  }, []);

  useEffect(() => {
    if (slot !== "bottom") {
      return;
    }

    const footer = document.querySelector<HTMLElement>("[data-site-footer]");
    if (!footer || typeof window === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          setFooterLift(0);
          return;
        }

        const overlap = Math.max(0, window.innerHeight - entry.boundingClientRect.top);
        setFooterLift(overlap);
      },
      {
        root: null,
        threshold: [0, 0.01, 0.25, 0.5, 0.75, 1]
      }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [slot]);

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
      <div
        data-floating-controls
        className="fixed right-[17px] z-40 flex flex-col items-end gap-[17px] sm:right-[29px]"
        style={{
          bottom: speechActive ? "200px" : `${12 + footerLift}px`
        }}
      >
        <FontSizeToggle />
      </div>
    </>
  );
}
