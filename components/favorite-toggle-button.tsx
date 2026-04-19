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
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

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
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
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
            : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        {className ? (
          <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <Heart strokeWidth={2} className={`h-[18px] w-[18px] ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
          </span>
        ) : (
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        )}
        {label ? <span className="ml-1">{label}</span> : null}
      </button>
      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
