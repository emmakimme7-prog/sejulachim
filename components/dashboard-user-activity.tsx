"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

type ActivityRow = {
  id: string;
  type: "email" | "share" | "auth" | "system";
  typeLabel: string;
  time: string;
  status: string;
  title: string;
  details: string;
};

const tabs = [
  { key: "all", label: "전체" },
  { key: "email", label: "이메일" },
  { key: "share", label: "공유" },
  { key: "auth", label: "인증 · 보안" },
  { key: "system", label: "시스템 작업" }
] as const;

export function DashboardUserActivity({ rows }: { rows: ActivityRow[] }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [selectedRow, setSelectedRow] = useState<ActivityRow | null>(null);

  const visibleRows = useMemo(() => {
    return activeTab === "all" ? rows : rows.filter((row) => row.type === activeTab);
  }, [activeTab, rows]);

  return (
    <section className="space-y-6 rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-full border px-4 py-3 text-sm font-semibold transition",
              activeTab === tab.key
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-navy-200 bg-white text-navy-700 hover:border-navy-300 hover:bg-navy-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-navy-100">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-sand text-navy-700">
            <tr>
              <th className="px-4 py-4 whitespace-nowrap">유형</th>
              <th className="px-4 py-4 whitespace-nowrap">일시</th>
              <th className="px-4 py-4 whitespace-nowrap">상태</th>
              <th className="px-4 py-4 whitespace-nowrap">항목</th>
              <th className="px-4 py-4 whitespace-nowrap">상세</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="border-t border-navy-100 align-top">
                <td className="px-4 py-4 font-semibold text-navy-900 whitespace-nowrap">{row.typeLabel}</td>
                <td className="px-4 py-4 text-navy-700 whitespace-nowrap">{new Date(row.time).toLocaleString("ko-KR")}</td>
                <td className="px-4 py-4 whitespace-nowrap"><StatusBadge value={row.status} /></td>
                <td className="px-4 py-4 font-semibold text-navy-900">{row.title}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setSelectedRow(row)}
                    className="rounded-full border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-800 transition hover:border-navy-300 hover:bg-navy-50"
                  >
                    보기
                  </button>
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-navy-500">
                  선택한 유형에 해당하는 기록이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/45 px-5 py-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRow(null);
            }
          }}
        >
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-navy-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">DETAIL</p>
                <h3 className="mt-2 text-2xl font-extrabold text-navy-900">{selectedRow.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-navy-200 text-navy-700 transition hover:border-navy-300 hover:bg-navy-50"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 overflow-hidden rounded-[24px] border border-navy-100">
              <table className="min-w-full text-left text-sm">
                <tbody>
                  <tr className="border-b border-navy-100">
                    <th className="w-32 bg-sand px-4 py-4 font-semibold text-navy-700">유형</th>
                    <td className="px-4 py-4 text-navy-900">{selectedRow.typeLabel}</td>
                  </tr>
                  <tr className="border-b border-navy-100">
                    <th className="w-32 bg-sand px-4 py-4 font-semibold text-navy-700">일시</th>
                    <td className="px-4 py-4 text-navy-900">{new Date(selectedRow.time).toLocaleString("ko-KR")}</td>
                  </tr>
                  <tr className="border-b border-navy-100">
                    <th className="w-32 bg-sand px-4 py-4 font-semibold text-navy-700">상태</th>
                    <td className="px-4 py-4"><StatusBadge value={selectedRow.status} /></td>
                  </tr>
                  <tr>
                    <th className="w-32 bg-sand px-4 py-4 font-semibold text-navy-700">내용</th>
                    <td className="px-4 py-4 text-sm leading-7 text-navy-700">{selectedRow.details}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
