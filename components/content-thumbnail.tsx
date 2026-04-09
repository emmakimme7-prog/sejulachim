"use client";

import { useEffect, useRef, useState } from "react";

type ContentThumbnailProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackLabel?: string;
};

export function ContentThumbnail({
  src,
  alt,
  className = "",
  imgClassName = "",
  fallbackLabel = "이미지 준비 중"
}: ContentThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // SSR 후 hydration 전에 이미지 로드가 실패하면 onError가 붙기 전이라 엑박이 고정됨.
  // 마운트 후 이미 실패한 상태(complete && naturalWidth === 0)를 감지해서 fallback 처리.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setHasError(true);
    }
  }, []);

  if (!src || hasError) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-navy-50 text-center text-xs font-semibold leading-5 text-navy-400`}
        aria-label={alt}
      >
        <span className="px-3">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={src} alt={alt} className={imgClassName} onError={() => setHasError(true)} />
    </div>
  );
}
