import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminUserStatusButton } from "@/components/admin-user-status-button";
import { AccountInterestsForm } from "@/components/account-interests-form";
import { DashboardUserActivity } from "@/components/dashboard-user-activity";
import { getInterestConfig } from "@/lib/content/interest-config";
import { getDashboardUserDetail } from "@/lib/mongodb/user-data";
import { getAvatarOption, isAvatarKey } from "@/lib/profile";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [detail, interestConfig] = await Promise.all([getDashboardUserDetail(id), getInterestConfig()]);

  if (!detail) {
    notFound();
  }

  const user = detail.user as typeof detail.user & {
    nickname?: string | null;
    avatar_key?: string | null;
    avatar_data_url?: string | null;
  };
  const avatar = getAvatarOption(isAvatarKey(user.avatar_key) ? user.avatar_key : "sun");
  const selectedInterests = detail.interests
    .map((row) => row.main_interest)
    .filter((value) => interestConfig.mainInterests.includes(value));
  const subInterests = Object.fromEntries(
    detail.interests.filter((row) => row.sub_interest).map((row) => [row.main_interest, row.sub_interest ?? ""])
  ) as Record<string, string>;
  const securityLogs = detail.jobLogs.filter((log) => /auth|password|login|signup|account\./i.test(log.job_name));
  const shareLogs = detail.jobLogs.filter((log) => log.job_name === "share.action");
  const operationLogs = detail.jobLogs.filter((log) => !/auth|password|login|signup|account\.|share\.action/i.test(log.job_name));

  function getSharedTitles(detailText?: string) {
    if (!detailText) return "-";
    const urlMatch = detailText.match(/url=([^\s]+)/);
    if (!urlMatch) return "-";
    try {
      const url = new URL(decodeURIComponent(urlMatch[1]));
      const slugs = url.searchParams.getAll("slug");
      return slugs.length > 0 ? slugs.join(", ") : url.pathname;
    } catch {
      return "-";
    }
  }

  function getShareEvent(detailText?: string) {
    if (!detailText) return "-";
    const eventMatch = detailText.match(/event=([^\s]+)/);
    return eventMatch?.[1] ?? "-";
  }

  const activityRows = [
    ...detail.emailLogs.map((log) => ({
      id: `email-${String(log._id)}`,
      type: "email" as const,
      typeLabel: "이메일",
      time: log.sent_at,
      status: log.status,
      title: "이메일 발송",
      details: log.provider_message_id ?? "provider id 없음"
    })),
    ...shareLogs.map((log) => ({
      id: `share-${String(log._id)}`,
      type: "share" as const,
      typeLabel: "공유",
      time: log.run_at,
      status: log.status,
      title: getShareEvent(log.details),
      details: `게시물: ${getSharedTitles(log.details)}`
    })),
    ...securityLogs.map((log) => ({
      id: `security-${String(log._id)}`,
      type: "auth" as const,
      typeLabel: "인증 · 보안",
      time: log.run_at,
      status: log.status,
      title: log.job_name,
      details: log.details ?? "상세 없음"
    })),
    ...operationLogs.map((log) => ({
      id: `operation-${String(log._id)}`,
      type: "system" as const,
      typeLabel: "시스템 작업",
      time: log.run_at,
      status: log.status,
      title: log.job_name,
      details: log.details ?? "상세 없음"
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="space-y-4 text-[13px]">
      <Link href="/dashboard/users" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-navy-200 text-navy-800 transition hover:border-navy-300 hover:bg-navy-50" aria-label="사용자 목록으로 돌아가기" title="사용자 목록으로 돌아가기">
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <section className="rounded-[18px] bg-white p-3 shadow-calm ring-1 ring-navy-100">
        <div className="overflow-hidden rounded-[14px] border border-navy-100">
          <table className="min-w-full text-left text-[13px]">
            <tbody>
              <tr>
                <th className="w-32 bg-sand px-3 py-3 text-xs font-semibold text-navy-700">프로필</th>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-2xl shadow-sm">
                      {user.avatar_data_url ? (
                        <Image src={user.avatar_data_url} alt="프로필 사진" width={48} height={48} className="h-12 w-12 rounded-full object-cover" unoptimized />
                      ) : (
                        avatar.emoji
                      )}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-navy-900">{user.nickname ?? user.email.split("@")[0]}</p>
                      <p className="mt-1 text-sm text-navy-700">{user.email}</p>
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="border-t border-navy-100 align-top">
                <th className="w-32 bg-sand px-3 py-3 text-xs font-semibold text-navy-700">고유 ID</th>
                <td className="px-4 py-3">
                  <p className="font-mono text-navy-600">{id}</p>
                </td>
                <th className="w-32 bg-sand px-3 py-3 text-xs font-semibold text-navy-700">비밀번호</th>
                <td className="px-4 py-3 text-navy-900">{user.has_password ? "설정됨" : "미설정"}</td>
              </tr>
              <tr className="border-t border-navy-100 align-top">
                <th className="w-32 bg-sand px-3 py-3 text-xs font-semibold text-navy-700">관심사</th>
                <td className="px-4 py-3" colSpan={3}>
                  <p className="text-navy-900">{detail.interests.length ? detail.interests.map((row) => row.sub_interest ? `${row.main_interest} · ${row.sub_interest}` : row.main_interest).join(", ") : "미설정"}</p>
                </td>
              </tr>
              <tr className="border-t border-navy-100 align-top">
                <th className="w-32 bg-sand px-3 py-3 text-xs font-semibold text-navy-700">상태</th>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                    {user.is_active ? "active" : "paused"}
                  </span>
                </td>
                <th className="w-32 bg-sand px-3 py-3 text-xs font-semibold text-navy-700">작업</th>
                <td className="px-4 py-3">
                  <AdminUserStatusButton userId={id} isActive={user.is_active} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[18px] bg-white p-3 shadow-calm ring-1 ring-navy-100">
        <h2 className="text-xs font-bold text-navy-900">수정</h2>
        <div className="mt-4">
          <AccountInterestsForm
            initialInterests={selectedInterests}
            initialSubInterests={subInterests}
            mainInterests={interestConfig.mainInterests}
            subInterestOptions={interestConfig.subInterests}
            interestLabels={interestConfig.labels}
            submitUrl={`/api/admin/users/${id}/preferences`}
            submitLabel="사용자 관심사 저장하기"
            successMessage="사용자 관심사가 저장되었습니다."
          />
        </div>
      </section>

      <section className="space-y-4 rounded-[18px] bg-white p-3 shadow-calm ring-1 ring-navy-100">
        <h2 className="text-xs font-bold text-navy-900">사용 기록</h2>
        <DashboardUserActivity rows={activityRows} />
      </section>
    </div>
  );
}
