"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PROVIDER_LABELS: Record<string, string> = {
  google: "구글",
  kakao: "카카오",
  naver: "네이버",
};

export function OAuthLinkedNotice() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const linked = searchParams.get("linked");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (linked && PROVIDER_LABELS[linked]) {
      setVisible(true);
      // URL에서 linked 파라미터 제거
      const url = new URL(window.location.href);
      url.searchParams.delete("linked");
      router.replace(url.pathname + url.search, { scroll: false });

      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [linked, router]);

  if (!visible || !linked || !PROVIDER_LABELS[linked]) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="rounded-2xl bg-emerald-50 px-6 py-4 text-base font-medium text-emerald-700 shadow-lg">
        {PROVIDER_LABELS[linked]} 계정으로 로그인되었습니다.
      </div>
    </div>
  );
}
