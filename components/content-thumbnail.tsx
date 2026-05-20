"use client";

import { useEffect, useRef, useState } from "react";

type ContentThumbnailProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackLabel?: string;
  /**
   * alt 가 영어 stock photo tag (콤마로 나열된 영문 키워드) 면 자동으로 무시하고
   * fallbackAlt 를 alt 로 사용. SEO + 접근성 + 중장년 스크린리더 사용자 모두에 유리.
   * 호출처에서 글 제목을 전달해두면 됨.
   */
  fallbackAlt?: string;
};

/**
 * alt 가 영어 stock photo tag 패턴인지 검사.
 *   예: "man, bench, sunset, silhouette, alone, nature, lonely, solitude..."
 * 휴리스틱:
 *   - 콤마로 단어 3개 이상
 *   - 한글이 거의 없음 (10% 미만)
 *   - 또는 한글 자체가 0
 */
function isLikelyStockPhotoTags(alt: string): boolean {
  const trimmed = alt.trim();
  if (!trimmed) return false;
  const segments = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  if (segments.length < 3) return false;
  const koreanChars = (trimmed.match(/[가-힣]/g) ?? []).length;
  const totalLetters = (trimmed.match(/[A-Za-z가-힣]/g) ?? []).length;
  if (totalLetters === 0) return false;
  const koreanRatio = koreanChars / totalLetters;
  return koreanRatio < 0.1; // 거의 영어만 → stock tag 로 간주
}

function resolveAlt(rawAlt: string, fallbackAlt?: string): string {
  if (fallbackAlt && isLikelyStockPhotoTags(rawAlt)) return fallbackAlt;
  return rawAlt;
}

export function ContentThumbnail({
  src,
  alt,
  className = "",
  imgClassName = "",
  fallbackLabel = "이미지 준비 중",
  fallbackAlt,
}: ContentThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const effectiveAlt = resolveAlt(alt, fallbackAlt);

  // SSR 후 hydration 전에 이미지 로드가 실패하면 onError가 붙기 전이라 엑박이 고정됨.
  // 마운트 후 이미 실패한 상태(complete && naturalWidth === 0)를 감지해서 fallback 처리.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setHasError(true);
    }
  }, []);

  if (!src || hasError) {
    // 이미지 없거나 로드 실패 시 빈 영역 표시 (placeholder 텍스트 대신 깔끔한 배경)
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100`}
        aria-label={effectiveAlt || fallbackLabel}
      />
    );
  }

  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={src} alt={effectiveAlt} className={imgClassName} onError={() => setHasError(true)} />
    </div>
  );
}
