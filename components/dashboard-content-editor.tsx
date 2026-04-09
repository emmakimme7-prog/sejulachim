"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SelectInput, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

type InterestConfig = {
  mainInterests: string[];
  labels: Record<string, string>;
  subInterests: Record<string, string[]>;
};

export function DashboardContentEditor({
  id,
  item,
  interestConfig
}: {
  id: string;
  item: {
    title: string;
    category: string;
    sub_interest?: string | null;
    source_name: string;
    source_url: string;
    short_summary?: string | null;
    action_line?: string | null;
    raw_text: string;
    summary_type: "MUST" | "USEFUL" | "ACTION";
    approval_status: "pending" | "approved" | "rejected";
    ai_status: "pending" | "completed" | "failed";
    sources?: Array<{ name: string; url: string; type: "public" | "news" | "blog" | "other" }>;
  };
  interestConfig: InterestConfig;
}) {
  const router = useRouter();
  const [state, setState] = useState({
    title: item.title,
    category: item.category,
    subInterest: item.sub_interest ?? "",
    sourceName: item.sources?.[0]?.name ?? item.source_name,
    sourceUrl: item.sources?.[0]?.url ?? item.source_url,
    sourceType: item.sources?.[0]?.type ?? "other",
    shortSummary: item.short_summary ?? "",
    actionLine: item.action_line ?? "",
    rawText: item.raw_text,
    summaryType: item.summary_type,
    approvalStatus: item.approval_status,
    aiStatus: item.ai_status
  });
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/admin/contents/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state)
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? "콘텐츠를 저장하지 못했습니다.");
        return;
      }
      setStatus("콘텐츠를 저장했습니다.");
      router.refresh();
    } catch {
      setStatus("콘텐츠를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput value={state.title} onChange={(event) => setState((current) => ({ ...current, title: event.target.value }))} />
        <SelectInput value={state.category} onChange={(event) => setState((current) => ({ ...current, category: event.target.value, subInterest: "" }))}>
          {interestConfig.mainInterests.map((interest) => (
            <option key={interest} value={interest}>
              {interestConfig.labels[interest] ?? interest}
            </option>
          ))}
        </SelectInput>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SelectInput value={state.subInterest} onChange={(event) => setState((current) => ({ ...current, subInterest: event.target.value }))}>
          <option value="">세부 관심 선택 안 함</option>
          {(interestConfig.subInterests[state.category] ?? []).map((subInterest) => (
            <option key={subInterest} value={subInterest}>
              {subInterest}
            </option>
          ))}
        </SelectInput>
        <TextInput value={state.sourceName} onChange={(event) => setState((current) => ({ ...current, sourceName: event.target.value }))} />
        <TextInput value={state.sourceUrl} onChange={(event) => setState((current) => ({ ...current, sourceUrl: event.target.value }))} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SelectInput value={state.sourceType} onChange={(event) => setState((current) => ({ ...current, sourceType: event.target.value as typeof current.sourceType }))}>
          <option value="public">공공자료</option>
          <option value="news">기사</option>
          <option value="blog">블로그</option>
          <option value="other">기타</option>
        </SelectInput>
        <SelectInput value={state.summaryType} onChange={(event) => setState((current) => ({ ...current, summaryType: event.target.value as typeof current.summaryType }))}>
          <option value="MUST">MUST</option>
          <option value="USEFUL">USEFUL</option>
          <option value="ACTION">ACTION</option>
        </SelectInput>
        <SelectInput value={state.approvalStatus} onChange={(event) => setState((current) => ({ ...current, approvalStatus: event.target.value as typeof current.approvalStatus }))}>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </SelectInput>
        <SelectInput value={state.aiStatus} onChange={(event) => setState((current) => ({ ...current, aiStatus: event.target.value as typeof current.aiStatus }))}>
          <option value="pending">pending</option>
          <option value="completed">completed</option>
          <option value="failed">failed</option>
        </SelectInput>
      </div>

      <textarea
        rows={4}
        value={state.shortSummary}
        onChange={(event) => setState((current) => ({ ...current, shortSummary: event.target.value }))}
        placeholder="세 줄 요약"
        className="w-full rounded-[28px] border border-navy-100 px-5 py-4 text-base text-navy-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />
      <TextInput value={state.actionLine} onChange={(event) => setState((current) => ({ ...current, actionLine: event.target.value }))} placeholder="오늘 한마디" />
      <textarea
        rows={8}
        value={state.rawText}
        onChange={(event) => setState((current) => ({ ...current, rawText: event.target.value }))}
        placeholder="원문"
        className="w-full rounded-[28px] border border-navy-100 px-5 py-4 text-base text-navy-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />

      {status ? <Notice tone={status.includes("못") ? "error" : "success"}>{status}</Notice> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "저장 중입니다..." : "콘텐츠 저장"}
        </Button>
      </div>
    </form>
  );
}
