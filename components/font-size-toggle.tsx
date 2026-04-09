"use client";

import { useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";

import { cn } from "@/lib/utils";

import { fontSizeOptions, useFontSize } from "@/components/font-size-provider";

export function FontSizeToggle() {
  const { fontSize, setFontSize } = useFontSize();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col items-end gap-[17px]">
      {open ? (
        <div className="absolute bottom-full right-0 mb-[17px] w-[276px] rounded-3xl border border-navy-200 bg-white p-[12px] shadow-[0_20px_45px_rgba(15,23,42,0.14)]">
          <p className="px-[17px] py-[12px] text-[20px] font-bold tracking-[0.08em] text-navy-500">글씨 크기 선택</p>
          <div className="grid gap-[6px]">
            {fontSizeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={`${option.label} 글씨 크기로 바꾸기`}
                aria-pressed={fontSize === option.value}
                onClick={() => {
                  setFontSize(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "min-h-[69px] rounded-2xl px-[23px] py-[17px] text-left text-[23px] font-semibold transition",
                  fontSize === option.value
                    ? "bg-navy-900 text-white"
                    : "bg-white text-navy-800 hover:bg-sand"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="글씨 크기 설정 열기"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-[48px] w-[48px] flex-nowrap items-center justify-center gap-[8px] rounded-full border border-navy-900 bg-navy-900 text-[15px] font-extrabold text-white shadow-[0_14px_32px_rgba(17,32,51,0.22)] transition hover:bg-navy-700 sm:w-auto sm:rounded-[24px] sm:px-[18px]"
      >
        <Type className="h-[20px] w-[20px] shrink-0" style={{ width: 20, height: 20 }} aria-hidden="true" />
        <span className="hidden shrink-0 whitespace-nowrap leading-none sm:inline" style={{ fontSize: 15 }}>글씨 크기</span>
      </button>
    </div>
  );
}
