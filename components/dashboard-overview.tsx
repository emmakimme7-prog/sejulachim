"use client";

import { useState } from "react";

import { DashboardLineChart } from "@/components/dashboard-line-chart";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export type DashboardOverviewData = {
  userCount: number;
  contentCount: number;
  latestEmailLog: { status?: string; sent_at?: string } | null;
  recentSignupCount: number;
  recentShareCount: number;
  weeklySignupSeries: Array<{ label: string; value: number }>;
  monthlySignupSeries: Array<{ label: string; value: number }>;
  weeklyShareSeries: Array<{ label: string; value: number }>;
};

export function DashboardOverview({ data }: { data: DashboardOverviewData }) {
  const [signupRange, setSignupRange] = useState<"week" | "month">("week");
  const signupPoints = signupRange === "week" ? data.weeklySignupSeries : data.monthlySignupSeries;
  const signupTotal = signupPoints.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-navy-500">가입자 근황</p>
              <p className="mt-2 text-4xl font-extrabold text-navy-900">{signupTotal}</p>
              <p className="mt-2 text-sm text-navy-500">{signupRange === "week" ? "최근 7일 기준" : "최근 4주 기준"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-navy-500">전체 가입자</p>
              <p className="mt-2 text-2xl font-bold text-navy-900">{data.userCount}</p>
              <div className="mt-4 inline-flex rounded-full border border-navy-200 bg-white p-1">
                {[
                  { key: "week", label: "주별" },
                  { key: "month", label: "월별" }
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSignupRange(option.key as "week" | "month")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      signupRange === option.key ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8">
            <DashboardLineChart points={signupPoints} />
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-navy-500">공유 근황</p>
              <p className="mt-2 text-4xl font-extrabold text-navy-900">{data.recentShareCount}</p>
              <p className="mt-2 text-sm text-navy-500">최근 7일 기준</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-navy-500">최근 발송 상태</p>
              <div className="mt-2 flex justify-end">
                <StatusBadge value={data.latestEmailLog?.status ?? "no-data"} />
              </div>
            </div>
          </div>
          <div className="mt-8">
            <DashboardLineChart points={data.weeklyShareSeries} stroke="#112033" />
          </div>
          <p className="mt-5 text-sm text-navy-500">
            {data.latestEmailLog?.sent_at ? new Date(data.latestEmailLog.sent_at).toLocaleString("ko-KR") : "아직 기록이 없습니다."}
          </p>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
          <p className="text-sm text-navy-500">전체 콘텐츠</p>
          <p className="mt-3 text-4xl font-extrabold text-navy-900">{data.contentCount}</p>
        </section>
        <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
          <p className="text-sm text-navy-500">발송 마지막 기록</p>
          <p className="mt-3 text-base font-semibold text-navy-900">
            {data.latestEmailLog?.sent_at ? new Date(data.latestEmailLog.sent_at).toLocaleString("ko-KR") : "기록 없음"}
          </p>
        </section>
        <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
          <p className="text-sm text-navy-500">공유 누적</p>
          <p className="mt-3 text-4xl font-extrabold text-navy-900">{data.weeklyShareSeries.reduce((sum, item) => sum + item.value, 0)}</p>
        </section>
      </div>
    </div>
  );
}
