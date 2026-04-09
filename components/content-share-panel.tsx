"use client";

import { CompleteShareButton } from "@/components/complete-share-button";

export function ContentSharePanel({
  slug,
  title
}: {
  slug: string;
  title: string;
}) {
  return (
    <div className="share-panel rounded-[24px] border border-navy-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold tracking-[0.16em] text-orange-500">공유하기</p>
      <p className="mt-3 text-sm leading-7 text-navy-700">이 소식을 저장해두거나 주변에 바로 공유해보세요.</p>
      <div className="mt-4">
        <CompleteShareButton
          shareUrl={`/archive/${slug}`}
          interestSummary={title}
          buttonLabel="이 소식 공유하기"
          modalTitle="이 소식을 공유해보세요."
        />
      </div>
    </div>
  );
}
