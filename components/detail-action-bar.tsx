"use client";

import { useState } from "react";
import { Bookmark, Heart } from "lucide-react";

import { CompleteShareButton } from "@/components/complete-share-button";

export function DetailActionBar({
  shareUrl,
  shareSlug,
  shareTitle,
}: {
  shareUrl?: string;
  shareSlug?: string;
  shareTitle: string;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="flex items-center gap-4 border-y border-gray-100 py-3">
      <button
        type="button"
        onClick={() => setIsLiked((v) => !v)}
        className={`flex items-center gap-1.5 text-[0.82rem] transition ${isLiked ? "text-red-500" : "text-gray-500 hover:text-gray-800"}`}
      >
        <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`} />
        좋아요
      </button>
      <button
        type="button"
        onClick={() => setIsBookmarked((v) => !v)}
        className={`flex items-center gap-1.5 text-[0.82rem] transition ${isBookmarked ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
      >
        <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-blue-600" : ""}`} />
        저장
      </button>
      <CompleteShareButton
        {...(shareSlug ? { shareSlugs: [shareSlug] } : { shareUrl })}
        interestSummary={shareTitle}
        buttonLabel="공유"
        triggerClassName="flex items-center gap-1.5 !h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[0.82rem] !font-normal !text-gray-500 hover:!text-gray-800 !shadow-none"
        modalTitle="이 소식을 공유해보세요."
      />
    </div>
  );
}
