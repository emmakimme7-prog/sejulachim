"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, FileText, HeartHandshake, ImageIcon, Logs, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "운영 홈", icon: BarChart3, match: (pathname: string) => pathname === "/dashboard" },
  { href: "/dashboard/homepage", label: "메인 설정", icon: ImageIcon, match: (pathname: string) => pathname.startsWith("/dashboard/homepage") },
  { href: "/dashboard/contents", label: "콘텐츠", icon: FileText, match: (pathname: string) => pathname.startsWith("/dashboard/contents") },
  { href: "/dashboard/interests", label: "관심사", icon: HeartHandshake, match: (pathname: string) => pathname.startsWith("/dashboard/interests") },
  { href: "/dashboard/users", label: "사용자", icon: Users, match: (pathname: string) => pathname.startsWith("/dashboard/users") },
  { href: "/dashboard/analytics", label: "방문자 분석", icon: Activity, match: (pathname: string) => pathname.startsWith("/dashboard/analytics") },
  { href: "/dashboard/logs", label: "발송 · 작업 로그", icon: Logs, match: (pathname: string) => pathname.startsWith("/dashboard/logs") }
];

export function DashboardSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-5 grid gap-2 text-[13px] font-semibold">
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 transition",
              active
                ? "border-navy-900 bg-navy-900 text-white shadow-[0_16px_40px_rgba(17,32,51,0.18)]"
                : "border-navy-100 bg-white text-navy-700 hover:border-navy-300 hover:bg-navy-50"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
