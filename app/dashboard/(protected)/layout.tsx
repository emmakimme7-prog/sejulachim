import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { DashboardSidebarNav } from "@/components/dashboard-sidebar-nav";

export default async function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-4 px-4 py-4">
      <aside className="w-full max-w-[210px] shrink-0 rounded-[20px] border border-navy-100 bg-white p-3 shadow-calm">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-orange-500">ADMIN</p>
        <h1 className="mt-2 text-base font-extrabold text-navy-900">세줄아침 관리자</h1>

        <DashboardSidebarNav />

        <form method="post" action="/api/admin/logout" className="mt-6">
          <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-navy-200 px-4 py-2.5 text-[13px] font-semibold text-navy-800 transition hover:border-navy-300 hover:bg-navy-50">
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 rounded-[20px] border border-navy-100 bg-white px-4 py-4 shadow-calm">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-orange-500">CONTROL PANEL</p>
          <h2 className="mt-2 text-xl font-extrabold text-navy-900">운영 관리 화면</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
