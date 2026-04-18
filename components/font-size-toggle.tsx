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
        <div className="absolute bottom-full right-0 mb-[10px] w-[160px] rounded-2xl border border-gray-300 bg-white p-[6px] shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
          <p className="px-[10px] py-[6px] text-[12px] font-bold tracking-[0.08em] text-gray-600">글씨 크기</p>
          <div className="grid gap-[3px]">
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
                  "min-h-[36px] whitespace-nowrap rounded-xl px-[12px] py-[8px] text-left text-[14px] font-semibold transition",
                  fontSize === option.value
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-800 hover:bg-sand"
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
        className="inline-flex h-[48px] w-[48px] flex-nowrap items-center justify-center gap-[8px] rounded-full border border-gray-900 bg-gray-900 text-[15px] font-extrabold text-white shadow-[0_14px_32px_rgba(17,32,51,0.22)] transition hover:bg-gray-700 sm:w-auto sm:rounded-[24px] sm:px-[18px]"
      >
        <Type className="h-[20px] w-[20px] shrink-0" style={{ width: 20, height: 20 }} aria-hidden="true" />
        <span className="hidden shrink-0 whitespace-nowrap leading-none sm:inline" style={{ fontSize: 15 }}>글씨 크기</span>
      </button>
    </div>
  );
}
