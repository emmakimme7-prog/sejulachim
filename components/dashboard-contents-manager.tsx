"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SelectInput, TextInput } from "@/components/ui/field";
import { Toast } from "@/components/ui/toast";

type ContentItemRow = {
  id: string;
  title: string;
  category: string;
  sub_interest?: string | null;
  summary_status: string;
  approval_status: string;
  created_at?: string;
};

type InterestConfig = {
  mainInterests: string[];
  labels: Record<string, string>;
  subInterests: Record<string, string[]>;
};

export function DashboardContentsManager({
  items,
  interestConfig
}: {
  items: ContentItemRow[];
  interestConfig: InterestConfig;
}) {
  const router = useRouter();
  const [titleQuery, setTitleQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subInterestFilter, setSubInterestFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "month" | "week" | "custom">("all");
  const [customDate, setCustomDate] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState(interestConfig.mainInterests[0] ?? "");
  const [formState, setFormState] = useState({
    title: "",
    subInterest: "",
    sourceName: "",
    sourceUrl: "",
    sourceType: "other",
    summaryType: "MUST",
    rawText: ""
  });

  const filteredItems = useMemo(() => {
    const now = new Date();

    const nextItems = items.filter((item) => {
      const itemDate = item.created_at ? new Date(item.created_at) : null;
      const matchesTitle = titleQuery.trim().length === 0 || item.title.toLowerCase().includes(titleQuery.trim().toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesSubInterest = subInterestFilter === "all" || (item.sub_interest ?? "") === subInterestFilter;

      let matchesDate = true;
      if (itemDate) {
        if (dateFilter === "week") {
          matchesDate = now.getTime() - itemDate.getTime() <= 1000 * 60 * 60 * 24 * 7;
        } else if (dateFilter === "month") {
          matchesDate = now.getTime() - itemDate.getTime() <= 1000 * 60 * 60 * 24 * 30;
        } else if (dateFilter === "custom" && customDate) {
          matchesDate = itemDate.toISOString().slice(0, 10) === customDate;
        }
      }

      return matchesTitle && matchesCategory && matchesSubInterest && matchesDate;
    });

    return [...nextItems].sort((a, b) => {
      if (sortOrder === "oldest") {
        return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      }
      if (sortOrder === "title") {
        return a.title.localeCompare(b.title, "ko");
      }
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });
  }, [categoryFilter, customDate, dateFilter, items, sortOrder, subInterestFilter, titleQuery]);

  const availableSubInterests = interestConfig.subInterests[category] ?? [];
  const availableSubInterestFilters = categoryFilter === "all" ? [] : interestConfig.subInterests[categoryFilter] ?? [];

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const response = await fetch("/api/admin/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formState.title,
          category,
          subInterest: formState.subInterest,
          sourceName: formState.sourceName,
          sourceUrl: formState.sourceUrl,
          sourceType: formState.sourceType,
          rawText: formState.rawText,
          summaryType: formState.summaryType
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setToast(payload.error ?? "콘텐츠를 저장하지 못했습니다.");
        return;
      }

      setShowModal(false);
      setFormState({
        title: "",
        subInterest: "",
        sourceName: "",
        sourceUrl: "",
        sourceType: "other",
        summaryType: "MUST",
        rawText: ""
      });
      router.refresh();
    } catch {
      setToast("콘텐츠를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 text-[13px]">
      <div className="grid gap-3">
        <div className="grid gap-3 rounded-[14px] bg-white p-3 shadow-calm ring-1 ring-navy-100 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <p className="text-xs font-semibold text-navy-500">제목</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
                <TextInput value={titleQuery} onChange={(event) => setTitleQuery(event.target.value)} placeholder="제목 검색" className="h-11 pl-12 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-navy-500">카테고리</p>
              <SelectInput value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-11 text-sm">
                <option value="all">전체</option>
                {interestConfig.mainInterests.map((item) => (
                  <option key={item} value={item}>
                    {interestConfig.labels[item] ?? item}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-navy-500">세부 관심</p>
              <SelectInput
                value={subInterestFilter}
                onChange={(event) => setSubInterestFilter(event.target.value)}
                className="h-11 text-sm"
                disabled={categoryFilter === "all"}
              >
                <option value="all">{categoryFilter === "all" ? "카테고리를 먼저 골라주세요" : "전체"}</option>
                {availableSubInterestFilters.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-navy-500">정렬</p>
              <SelectInput value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="h-11 text-sm">
                <option value="latest">최신순</option>
                <option value="oldest">과거순</option>
                <option value="title">제목순</option>
              </SelectInput>
            </div>
          </div>

        <div className="grid gap-3 rounded-[14px] bg-white p-3 shadow-calm ring-1 ring-navy-100 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-5">
              <p className="text-xs font-semibold text-navy-500">일시</p>
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
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
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
            {dateFilter === "custom" ? (
              <div className="space-y-2 lg:col-span-2">
                <p className="text-xs font-semibold text-navy-500">날짜 지정</p>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
                  <TextInput type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} className="h-11 pl-12 text-sm" />
                </div>
              </div>
            ) : null}
          </div>
        <div className="flex justify-end pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            콘텐츠 수동 등록
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[16px] bg-white shadow-calm ring-1 ring-navy-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[12px]">
            <thead className="bg-sand text-navy-700">
              <tr>
                <th className="px-3 py-3">제목</th>
                <th className="px-3 py-3">카테고리</th>
                <th className="px-3 py-3">등록일시</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-navy-100 align-top">
                  <td className="px-3 py-3 font-semibold text-navy-900">
                    <Link href={`/dashboard/contents/${item.id}`} className="hover:text-orange-500">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-navy-900">{interestConfig.labels[item.category] ?? item.category}</p>
                    {item.sub_interest ? <p className="mt-1 text-xs text-navy-500">{item.sub_interest}</p> : null}
                  </td>
                  <td className="px-3 py-3">
                    {item.created_at ? new Date(item.created_at).toLocaleString("ko-KR") : "-"}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-navy-500">
                    조건에 맞는 콘텐츠가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/45 px-5 py-8" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-5xl rounded-[20px] bg-white p-5 shadow-2xl ring-1 ring-navy-100 md:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 className="text-xl font-extrabold text-navy-900">콘텐츠 수동 등록</h2>
              <button type="button" onClick={() => setShowModal(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-navy-200 bg-white text-navy-900" aria-label="모달 닫기">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-navy-500">제목</span>
                  <TextInput required placeholder="제목" value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-navy-500">카테고리</span>
                  <SelectInput value={category} onChange={(event) => {
                    setCategory(event.target.value);
                    setFormState((current) => ({ ...current, subInterest: "" }));
                  }}>
                    {interestConfig.mainInterests.map((item) => (
                      <option key={item} value={item}>
                        {interestConfig.labels[item] ?? item}
                      </option>
                    ))}
                  </SelectInput>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-navy-500">세부 관심</span>
                  <SelectInput value={formState.subInterest} onChange={(event) => setFormState((current) => ({ ...current, subInterest: event.target.value }))}>
                    <option value="">세부 관심 선택 안 함</option>
                    {availableSubInterests.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </SelectInput>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-navy-500">출처명</span>
                  <TextInput required placeholder="출처명" value={formState.sourceName} onChange={(event) => setFormState((current) => ({ ...current, sourceName: event.target.value }))} />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-navy-500">출처 링크</span>
                  <TextInput required placeholder="https://example.com" value={formState.sourceUrl} onChange={(event) => setFormState((current) => ({ ...current, sourceUrl: event.target.value }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-navy-500">출처 유형</span>
                  <SelectInput value={formState.sourceType} onChange={(event) => setFormState((current) => ({ ...current, sourceType: event.target.value }))}>
                    <option value="public">공공자료</option>
                    <option value="news">기사</option>
                    <option value="blog">블로그</option>
                    <option value="other">기타</option>
                  </SelectInput>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-navy-500">소식 유형</span>
                  <SelectInput value={formState.summaryType} onChange={(event) => setFormState((current) => ({ ...current, summaryType: event.target.value }))}>
                    <option value="MUST">꼭 알아둘 일</option>
                    <option value="USEFUL">생활에 도움 되는 일</option>
                    <option value="ACTION">오늘 해볼 일</option>
                  </SelectInput>
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-navy-500">원문 또는 출처 내용</span>
                <textarea
                  required
                  rows={8}
                  placeholder="원문 또는 출처 내용을 붙여 넣어주세요."
                  value={formState.rawText}
                  onChange={(event) => setFormState((current) => ({ ...current, rawText: event.target.value }))}
                  className="rounded-[28px] border border-navy-100 px-5 py-4 text-base text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </label>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>{saving ? "저장 중입니다..." : "콘텐츠 저장"}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? <Toast message={toast} tone="error" /> : null}
    </div>
  );
}
