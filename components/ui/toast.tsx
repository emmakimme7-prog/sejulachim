"use client";

import { cn } from "@/lib/utils";

export function Toast({ message, tone = "default" }: { message: string; tone?: "default" | "error" }) {
  return (
    <div
      className={cn(
        "fixed left-1/2 top-1/2 z-[80] flex min-h-14 max-w-[min(92vw,560px)] items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-[22px] px-6 py-4 text-center text-base font-semibold leading-7 shadow-[0_18px_40px_rgba(17,32,51,0.28)]",
        tone === "error"
          ? "border border-[#FECACA] bg-[#C62828] text-[#FFFFFF]"
          : "border border-[#112033] bg-[#112033] text-[#FFFFFF]"
      )}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}
