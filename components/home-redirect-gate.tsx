"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { fetchSessionCached } from "@/lib/auth/session-client";

export function HomeRedirectGate() {
  const router = useRouter();

  useEffect(() => {
    // QA: page mount 시 4개 컴포넌트가 동시 /api/auth/session 호출 → 11회+ polling.
    //     module cache 로 같은 응답 share.
    let cancelled = false;
    fetchSessionCached()
      .then((data) => {
        if (!cancelled && (data as { session?: unknown } | null)?.session) {
          router.replace("/archive");
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
