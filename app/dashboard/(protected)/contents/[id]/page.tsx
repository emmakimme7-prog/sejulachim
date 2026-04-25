import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DashboardContentEditor } from "@/components/dashboard-content-editor";
import { SourceDisplay } from "@/components/source-display";
import { StatusBadge } from "@/components/status-badge";
import { getInterestConfig } from "@/lib/content/interest-config";
import { normalizeSources } from "@/lib/content/sources";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardContentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const interestConfig = await getInterestConfig();

  const item = hasSupabaseServerEnv()
    ? (
        await createAdminSupabaseClient()
          .from('sj_content_items')
          .select("*")
          .eq("id", id)
          .maybeSingle()
      ).data
    : null;

  if (!item) {
    notFound();
  }

  const summaryStatus = "summary_status" in item ? item.summary_status : item.ai_status;
  const subInterest = item.sub_interest ?? null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/contents" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-navy-200 text-navy-800 transition hover:border-navy-300 hover:bg-navy-50" aria-label="콘텐츠 목록으로 돌아가기" title="콘텐츠 목록으로 돌아가기">
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <section className="rounded-[28px] bg-white p-8 shadow-calm ring-1 ring-navy-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">CONTENT DETAIL</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.28] tracking-[-0.04em] text-navy-900">{item.title}</h1>
            <p className="mt-4 text-base leading-7 text-navy-600">
              {interestConfig.labels[item.category] ?? item.category}
              {subInterest ? ` · ${subInterest}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={summaryStatus} />
            <StatusBadge value={item.approval_status} />
            <StatusBadge value={item.summary_type} />
          </div>
        </div>
      </section>

      <DashboardContentEditor
        id={id}
        item={{
          title: item.title,
          category: item.category,
          sub_interest: subInterest,
          source_name: item.source_name,
          source_url: item.source_url,
          short_summary: item.short_summary,
          action_line: item.action_line,
          raw_text: item.raw_text,
          summary_type: item.summary_type,
          approval_status: item.approval_status,
          ai_status: summaryStatus,
          sources: item.sources
        }}
        interestConfig={interestConfig}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100 xl:col-span-2">
          <h2 className="text-2xl font-bold text-navy-900">세 줄 요약</h2>
          <div className="mt-5 space-y-4 rounded-[24px] bg-navy-50/60 p-5">
            <div>
              <p className="text-sm font-semibold text-orange-500">핵심 요약</p>
              <p className="mt-2 text-base leading-8 text-navy-700">{item.short_summary ?? "아직 요약되지 않았습니다."}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-500">오늘 한마디</p>
              <p className="mt-2 text-base font-semibold leading-8 text-navy-900">{item.action_line ?? "아직 한마디가 없습니다."}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
          <h2 className="text-2xl font-bold text-navy-900">출처 정보</h2>
          <SourceDisplay sources={normalizeSources(item)} className="mt-5" />
        </section>
      </div>

      <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
        <h2 className="text-2xl font-bold text-navy-900">원문 내용</h2>
        <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-navy-700">{item.raw_text}</p>
      </section>
    </div>
  );
}
