"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId() {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem("slm_sid");
    if (!id) {
      id = typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem("slm_sid", id);
    }
    return id;
  } catch {
    return "";
  }
}

// UTM 파라미터: 세션 최초 방문 시 캡처해서 세션 내내 유지
function getSessionUtm() {
  if (typeof window === "undefined") return {};
  try {
    const cached = localStorage.getItem("slm_utm");
    if (cached) {
      try { return JSON.parse(cached) as Record<string, string>; } catch { /* ignore */ }
    }
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    const src = params.get("utm_source");
    const med = params.get("utm_medium");
    const cam = params.get("utm_campaign");
    if (src) utm.utm_source = src;
    if (med) utm.utm_medium = med;
    if (cam) utm.utm_campaign = cam;
    if (Object.keys(utm).length > 0) {
      localStorage.setItem("slm_utm", JSON.stringify(utm));
    }
    return utm;
  } catch {
    return {};
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef("");

  useEffect(() => {
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    const sessionId = getSessionId();
    if (!sessionId) return;

    if (pathname.startsWith("/dashboard")) return;

    const timer = setTimeout(() => {
      const utm = getSessionUtm();
      fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          path: pathname,
          referrer: document.referrer || null,
          language: navigator.language?.slice(0, 20) || null,
          screenWidth: window.screen.width || null,
          ...utm,
        }),
        keepalive: true,
      }).catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
