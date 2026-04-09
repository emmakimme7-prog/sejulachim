"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { Toast } from "@/components/ui/toast";

export function FavoriteToggleButton({
  slug,
  contentItemId,
  initialFavorite = false,
  className,
  label
}: {
  slug: string;
  contentItemId?: string;
  initialFavorite?: boolean;
  className?: string;
  label?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, setIsPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleToggle() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/content/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentItemId, slug })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "즐겨찾기 저장 실패");
      }
      setIsFavorite(Boolean(data.isFavorite));
      setToast(data.isFavorite ? "내 서점에 담았습니다." : "내 서점에서 뺐습니다.");
    } catch {
      setToast("즐겨찾기를 저장하지 못했습니다.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
        className={className ?? `inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
          isFavorite
            ? "border-orange-200 bg-orange-50 text-orange-500"
            : "border-navy-200 bg-white text-navy-500 hover:bg-navy-50"
        }`}
      >
        <Heart className={className ? `h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}` : `h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        {label ? <span className="ml-1">{label}</span> : null}
      </button>
      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
