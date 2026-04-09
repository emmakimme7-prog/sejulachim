"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { AdminUserStatusButton } from "@/components/admin-user-status-button";
import { StatusBadge } from "@/components/status-badge";
import { SelectInput, TextInput } from "@/components/ui/field";

type UserRow = {
  id: string;
  email: string;
  nickname?: string | null;
  created_at?: string;
  delivery_time: string;
  is_active: boolean;
  user_interest_selections: Array<{ main_interest: string; sub_interest: string | null }>;
};

export function DashboardUsersTable({ rows }: { rows: UserRow[] }) {
  const [idQuery, setIdQuery] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [interestQuery, setInterestQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filteredRows = useMemo(() => {
    return rows.filter((user) => {
      const interests = user.user_interest_selections
        .map((item) => `${item.main_interest} ${item.sub_interest ?? ""}`)
        .join(" ");
      const createdAt = user.created_at ? new Date(user.created_at) : null;
      const now = new Date();

      const matchesEmail = emailQuery.trim().length === 0 || user.email.toLowerCase().includes(emailQuery.trim().toLowerCase());
      const matchesId = idQuery.trim().length === 0 || user.id.toLowerCase().includes(idQuery.trim().toLowerCase());
      const matchesName = nameQuery.trim().length === 0 || (user.nickname ?? "").toLowerCase().includes(nameQuery.trim().toLowerCase());
      const matchesInterest = interestQuery.trim().length === 0 || interests.toLowerCase().includes(interestQuery.trim().toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "paused" && !user.is_active);

      let matchesDate = true;
      if (createdAt) {
        if (dateFilter === "month") {
          matchesDate = now.getTime() - createdAt.getTime() <= 1000 * 60 * 60 * 24 * 30;
        } else if (dateFilter === "week") {
          matchesDate = now.getTime() - createdAt.getTime() <= 1000 * 60 * 60 * 24 * 7;
        }
      }

      return matchesId && matchesEmail && matchesName && matchesInterest && matchesStatus && matchesDate;
    });
  }, [dateFilter, emailQuery, idQuery, interestQuery, nameQuery, rows, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 rounded-[28px] bg-white p-5 shadow-calm ring-1 ring-navy-100 lg:grid-cols-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">고유 ID</p>
          <TextInput value={idQuery} onChange={(event) => setIdQuery(event.target.value)} placeholder="고유 ID 검색" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">이메일</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
            <TextInput value={emailQuery} onChange={(event) => setEmailQuery(event.target.value)} placeholder="이메일 검색" className="pl-12" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">이름</p>
          <TextInput value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="이름 검색" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">관심사</p>
          <TextInput value={interestQuery} onChange={(event) => setInterestQuery(event.target.value)} placeholder="관심사 검색" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">상태</p>
          <SelectInput value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">전체</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
          </SelectInput>
        </div>
      </div>

      <div className="grid gap-4 rounded-[28px] bg-white p-5 shadow-calm ring-1 ring-navy-100">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-500">가입일시</p>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "전체" },
              { key: "month", label: "최근 1개월" },
              { key: "week", label: "최근 1주일" }
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setDateFilter(option.key)}
                className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                  dateFilter === option.key
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-navy-200 bg-white text-navy-700 hover:border-navy-300 hover:bg-navy-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-calm ring-1 ring-navy-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-sand text-navy-700">
              <tr>
                <th className="px-4 py-4">이메일</th>
                <th className="px-4 py-4">이름</th>
                <th className="px-4 py-4">관심사</th>
                <th className="px-4 py-4">가입일시</th>
                <th className="px-4 py-4">발송 시간</th>
                <th className="px-4 py-4">상태</th>
                <th className="px-4 py-4">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((user) => (
                <tr key={user.id} className="border-t border-navy-100 align-top">
                  <td className="px-4 py-4 font-medium text-navy-900">
                    <Link href={`/dashboard/users/${user.id}`} className="font-semibold text-orange-500 underline underline-offset-4">
                      {user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-navy-700">{user.nickname ?? "-"}</td>
                  <td className="px-4 py-4 text-navy-700">
                    {user.user_interest_selections.map((item) => `${item.main_interest}${item.sub_interest ? ` · ${item.sub_interest}` : ""}`).join(", ")}
                  </td>
                  <td className="px-4 py-4 text-navy-700">{user.created_at ? new Date(user.created_at).toLocaleString("ko-KR") : "-"}</td>
                  <td className="px-4 py-4">{user.delivery_time}</td>
                  <td className="px-4 py-4">
                    <StatusBadge value={user.is_active ? "active" : "paused"} />
                  </td>
                  <td className="px-4 py-4">
                    <AdminUserStatusButton userId={user.id} isActive={user.is_active} iconOnly />
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-navy-500">
                    조건에 맞는 사용자가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
