"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Search } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { SelectInput, TextInput } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type EmailLog = {
  _id?: { toString(): string } | string;
  id?: string;
  user_email?: string | null;
  status: string;
  sent_at?: string;
  provider_message_id?: string | null;
};

type JobLog = {
  _id?: { toString(): string } | string;
  id?: string;
  job_name: string;
  run_at: string;
  status: string;
  details?: string;
};

type LogRow = {
  id: string;
  type: "email" | "auth" | "system";
  typeLabel: string;
  email: string;
  time: string;
  status: string;
  title: string;
  details: string;
};

const typeOptions = [
  { key: "all", label: "전체" },
  { key: "email", label: "이메일" },
  { key: "auth", label: "인증 · 보안" },
  { key: "system", label: "시스템 작업" }
] as const;

function extractEmail(details?: string) {
  if (!details) return "-";
  const match = details.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? "-";
}

export function DashboardLogsManager({
  emailLogs,
  jobLogs
}: {
  emailLogs: EmailLog[];
  jobLogs: JobLog[];
}) {
  const [emailQuery, setEmailQuery] = useState("");
  const [detailQuery, setDetailQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]["key"]>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "month" | "week" | "custom">("all");
  const [customDate, setCustomDate] = useState("");

  const rows = useMemo<LogRow[]>(() => {
    const emailRows = emailLogs.map((log) => ({
      id: String(log.id ?? log._id),
      type: "email" as const,
      typeLabel: "이메일",
      email: log.user_email ?? "-",
      time: log.sent_at ?? "",
      status: log.status,
      title: "이메일 발송",
      details: log.provider_message_id ?? "provider id 없음"
    }));

    const jobRows = jobLogs.map((log) => {
      const isAuth = /auth|password|login|signup|reset/i.test(log.job_name);
      return {
        id: String(log.id ?? log._id),
        type: isAuth ? ("auth" as const) : ("system" as const),
        typeLabel: isAuth ? "인증 · 보안" : "시스템 작업",
        email: extractEmail(log.details),
        time: log.run_at,
        status: log.status,
        title: log.job_name,
        details: log.details ?? "상세 없음"
      };
    });

    return [...emailRows, ...jobRows].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [emailLogs, jobLogs]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesType = typeFilter === "all" || row.type === typeFilter;
      const matchesEmail = emailQuery.trim().length === 0 || row.email.toLowerCase().includes(emailQuery.trim().toLowerCase());
      const matchesDetails =
        detailQuery.trim().length === 0 ||
        [row.title, row.details].join(" ").toLowerCase().includes(detailQuery.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" || row.status.toLowerCase() === statusFilter;

      let matchesDate = true;
      if (row.time) {
        const rowDate = new Date(row.time);
        const now = new Date();
        if (dateFilter === "week") {
          matchesDate = now.getTime() - rowDate.getTime() <= 1000 * 60 * 60 * 24 * 7;
        } else if (dateFilter === "month") {
          matchesDate = now.getTime() - rowDate.getTime() <= 1000 * 60 * 60 * 24 * 30;
        } else if (dateFilter === "custom" && customDate) {
          matchesDate = rowDate.toISOString().slice(0, 10) === customDate;
        }
      }

      return matchesType && matchesEmail && matchesDetails && matchesStatus && matchesDate;
    });
  }, [customDate, dateFilter, detailQuery, emailQuery, rows, statusFilter, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 rounded-[28px] bg-white p-5 shadow-calm ring-1 ring-navy-100 lg:grid-cols-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">유형</p>
          <SelectInput value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
            {typeOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">이메일</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
            <TextInput value={emailQuery} onChange={(event) => setEmailQuery(event.target.value)} placeholder="이메일 검색" className="pl-12" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">상태</p>
          <SelectInput value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">전체</option>
            <option value="success">success</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
            <option value="not_found">not_found</option>
            <option value="accepted">accepted</option>
            <option value="completed">completed</option>
          </SelectInput>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">내용</p>
          <TextInput value={detailQuery} onChange={(event) => setDetailQuery(event.target.value)} placeholder="내용 검색" />
        </div>
      </div>

      <div className="grid gap-4 rounded-[28px] bg-white p-5 shadow-calm ring-1 ring-navy-100 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">일시</p>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "전체" },
              { key: "month", label: "최근 1개월" },
              { key: "week", label: "최근 1주일" },
              { key: "custom", label: "날짜 지정" }
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setDateFilter(option.key as typeof dateFilter)}
                className={cn(
                  "rounded-full border px-4 py-3 text-sm font-semibold transition",
                  dateFilter === option.key
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-navy-200 bg-white text-navy-700 hover:border-navy-300 hover:bg-navy-50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {dateFilter === "custom" ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-navy-500">날짜 지정</p>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
              <TextInput type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} className="pl-12" />
            </div>
          </div>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-[28px] bg-white shadow-calm ring-1 ring-navy-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-sand text-navy-700">
              <tr>
                <th className="px-4 py-4 whitespace-nowrap">유형</th>
                <th className="px-4 py-4 whitespace-nowrap">이메일</th>
                <th className="px-4 py-4 whitespace-nowrap">일시</th>
                <th className="px-4 py-4 whitespace-nowrap">상태</th>
                <th className="px-4 py-4">내용</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-navy-100 align-top">
                  <td className="px-4 py-4 font-semibold text-navy-900 whitespace-nowrap">{row.typeLabel}</td>
                  <td className="px-4 py-4 text-navy-700 whitespace-nowrap">{row.email}</td>
                  <td className="px-4 py-4 text-navy-700 whitespace-nowrap">{row.time ? new Date(row.time).toLocaleString("ko-KR") : "-"}</td>
                  <td className="px-4 py-4 whitespace-nowrap"><StatusBadge value={row.status} /></td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-navy-900">{row.title}</p>
                    <p className="mt-1 text-sm leading-7 text-navy-500">{row.details}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
