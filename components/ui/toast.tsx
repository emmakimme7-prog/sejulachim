"use client";

import { cn } from "@/lib/utils";

export function Toast({ message, tone = "default" }: { message: string; tone?: "default" | "error" }) {
  return (
    <div
      className={cn(
        "fixed left-1/2 top-1/2 z-[80] flex min-h-12 max-w-[min(92vw,560px)] items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-2xl px-5 py-3.5 text-center text-sm font-semibold leading-6 shadow-lg",
        tone === "error"
          ? "bg-rose-600 text-white"
          : "bg-gray-900 text-white"
      )}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}
