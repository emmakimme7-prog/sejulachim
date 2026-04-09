import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type NoticeTone = "success" | "error" | "info";

const toneStyles: Record<NoticeTone, string> = {
  success: "bg-emerald-50 text-emerald-700",
  error: "bg-rose-50 text-rose-700",
  info: "bg-navy-50 text-navy-700"
};

export function Notice({ children, tone = "info", className }: { children: ReactNode; tone?: NoticeTone; className?: string }) {
  return <p className={cn("rounded-2xl px-5 py-4 text-base leading-7", toneStyles[tone], className)}>{children}</p>;
}
