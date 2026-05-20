"use client";

import { ChevronRight, Headphones } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ContentThumbnail } from "@/components/content-thumbnail";
import { ListenButton, getListenedSlugs, subscribeListenedSlugs } from "@/components/speech-controls";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const CATEGORY_STYLE: Record<string, string> = {
  "실생활": "bg-blue-50 border border-blue-200 text-blue-700",
  "건강": "bg-green-50 border border-green-200 text-green-700",
  "돈": "bg-amber-50 border border-amber-200 text-amber-700",
  "뉴스": "bg-slate-50 border border-slate-200 text-slate-700",
  "관계": "bg-rose-50 border border-rose-200 text-rose-700",
};

type TodayBriefItem = {
  id: string;
  title: string;
  short_summary: string;
  action_line?: string | null;
  slug: string;
  published_at: string | null;
  main_interest: string;
  sub_interest: string | null;
  thumbnail_url?: string | null;
  thumbnail_alt?: string | null;
  thumbnail_page_url?: string | null;
  thumbnail_license?: string | null;
  audio_url?: string | null;
};

export function TodayBriefs({
  items,
  interestLabels,
  settings
}: {
  items: TodayBriefItem[];
  interestLabels: Record<string, string>;
  interestOrder?: string[];
  settings?: {
    sectionTitle?: string;
    sectionDescription?: string;
    imageUrl?: string;
    imageAlt?: string;
    imageTitle?: string;
    imageDescription?: string;
  };
}) {
  const tabs = useMemo(() => [...new Set(items.map((item) => item.main_interest))], [items]);
  const [activeTab, setActiveTab] = useState<string>(tabs[0] ?? "");

  const visibleItems = useMemo(
    () => items.filter((item) => item.main_interest === activeTab).slice(0, 5),
    [activeTab, items]
  );

  const [listened, setListened] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    setListened(getListenedSlugs());
    return subscribeListenedSlugs(() => setListened(getListenedSlugs()));
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-10 md:pt-16">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-gray-900 md:text-4xl">
          {settings?.sectionTitle?.trim() || "오늘의 소식"}
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600 md:text-base md:leading-7">
          {settings?.sectionDescription?.trim() || "오늘 올라온 소식 중 생활에 바로 닿는 세 가지를 골라 보여드립니다."}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {tabs.map((tab) => (
            <Button
              key={tab}
              type="button"
              variant={activeTab === tab ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? undefined : "text-gray-700"}
            >
              {interestLabels[tab] ?? tab}
            </Button>
          ))}
        </div>
        <Link
          href={`/?category=${encodeURIComponent(activeTab)}&view=today`}
          className="shrink-0 text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors"
        >
          {interestLabels[activeTab] ?? activeTab} 전체 보기 →
        </Link>
      </div>

      <div className="mt-6 grid gap-3">
        {visibleItems.map((item) => (
          <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md md:p-5">
            {/* 상단: 카테고리 + 날짜 */}
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[item.main_interest] ?? "bg-orange-50 border border-orange-200 text-orange-700"}`}>
                {interestLabels[item.main_interest] ?? item.main_interest}
                {item.sub_interest ? ` · ${item.sub_interest}` : ""}
              </span>
              {listened.has(item.slug) ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
                  <Headphones className="h-3 w-3" aria-hidden="true" />
                  들었어요
                </span>
              ) : null}
              <span className="ml-auto text-xs text-gray-500">
                {item.published_at ? formatDate(item.published_at) : "오늘"}
              </span>
            </div>

            {/* 본문 */}
            <Link href={`/archive/${item.slug}`} className="group block">
              <div className="md:flex md:items-stretch md:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-stretch gap-3">
                    <h3
                      className="flex-1 md:flex-none font-bold leading-snug break-all text-gray-900 transition group-hover:text-orange-600"
                      style={{ fontSize: "calc(20px * var(--font-scale, 1))" }}
                    >
                      {item.title}
                    </h3>
                    {item.thumbnail_url ? (
                      <ContentThumbnail
                        src={item.thumbnail_url}
                        alt={item.thumbnail_alt?.trim() || item.title}
                        fallbackAlt={item.title}
                        className="w-20 min-h-[5rem] shrink-0 overflow-hidden rounded-md md:hidden"
                        imgClassName="w-full h-full object-cover"
                        fallbackLabel="준비 중"
                      />
                    ) : null}
                  </div>
                  <p
                    className="mt-2 leading-6 break-all text-gray-600"
                    style={{ fontSize: "calc(14px * var(--font-scale, 1))" }}
                  >
                    {item.short_summary}
                  </p>
                  {item.action_line ? (
                    <p className="mt-1.5 text-xs font-semibold text-orange-600">
                      {item.action_line}
                      <ChevronRight className="ml-[2px] inline h-[14px] w-[14px] align-middle" aria-hidden="true" />
                    </p>
                  ) : null}
                </div>
                {item.thumbnail_url ? (
                  <ContentThumbnail
                    src={item.thumbnail_url}
                    alt={item.thumbnail_alt?.trim() || item.title}
                    fallbackAlt={item.title}
                    className="hidden md:block w-28 min-h-[6rem] shrink-0 overflow-hidden rounded-md"
                    imgClassName="w-full h-full object-cover"
                    fallbackLabel="준비 중"
                  />
                ) : null}
              </div>
            </Link>

            {/* 하단: 듣기 버튼 */}
            <div className="mt-3 border-t border-gray-50 pt-3">
              <ListenButton
                text={[item.title, item.short_summary, item.action_line].filter(Boolean).join(". ")}
                speechTitle={item.title}
                className="h-8 px-3 text-xs"
                label="듣기"
                mobileIconOnly
                audioUrl={item.audio_url}
                trackSlug={item.slug}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
