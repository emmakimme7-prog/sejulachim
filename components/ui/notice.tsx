import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type NoticeTone = "success" | "error" | "info";

const toneStyles: Record<NoticeTone, string> = {
  success: "bg-emerald-50 border-emerald-100 text-emerald-700",
  error: "bg-rose-50 border-rose-100 text-rose-700",
  info: "bg-gray-50 border-gray-200 text-gray-700"
};

export function Notice({ children, tone = "info", className }: { children: ReactNode; tone?: NoticeTone; className?: string }) {
  return (
    <p className={cn("rounded-xl border px-4 py-3 text-sm leading-6", toneStyles[tone], className)}>
      {children}
    </p>
  );
}
