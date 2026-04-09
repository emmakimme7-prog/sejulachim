import { cn } from "@/lib/utils";

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const colorMap: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700",
    active: "bg-emerald-50 text-emerald-700",
    sent: "bg-emerald-50 text-emerald-700",
    success: "bg-teal-50 text-teal-700",
    completed: "bg-cyan-50 text-cyan-700",
    done: "bg-cyan-50 text-cyan-700",
    accepted: "bg-sky-50 text-sky-700",
    ready: "bg-indigo-50 text-indigo-700",
    processing: "bg-violet-50 text-violet-700",
    must: "bg-red-50 text-red-700",
    useful: "bg-blue-50 text-blue-700",
    action: "bg-orange-50 text-orange-700",
    pending: "bg-amber-50 text-amber-700",
    password_required: "bg-amber-50 text-amber-700",
    no_password: "bg-yellow-50 text-yellow-700",
    not_found: "bg-orange-50 text-orange-700",
    rejected: "bg-rose-50 text-rose-700",
    failed: "bg-rose-50 text-rose-700",
    invalid: "bg-rose-50 text-rose-700",
    inactive: "bg-slate-100 text-slate-700",
    paused: "bg-slate-100 text-slate-700"
  };

  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", colorMap[normalized] ?? "bg-navy-50 text-navy-700")}>
      {value}
    </span>
  );
}
