"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { ContentThumbnail } from "@/components/content-thumbnail";
import { SourceDisplay } from "@/components/source-display";
import { formatDate } from "@/lib/utils";
import type { ContentSource } from "@/lib/content/sources";

const CATEGORY_STYLE: Record<string, string> = {
  "실생활": "bg-blue-50 border border-blue-200 text-blue-700",
  "건강": "bg-green-50 border border-green-200 text-green-700",
  "돈": "bg-amber-50 border border-amber-200 text-amber-700",
  "뉴스": "bg-slate-50 border border-slate-200 text-slate-700",
  "관계": "bg-rose-50 border border-rose-200 text-rose-700",
};

type SharedBriefItem = {
  slug: string;
  title: string;
  short_summary: string;
  long_summary?: string | null;
  action_line?: string | null;
  published_at: string | null;
  main_interest?: string | null;
  sub_interest?: string | null;
  thumbnail_url?: string | null;
  thumbnail_alt?: string | null;
  sources: ContentSource[];
};

export function SharedBriefCard({ item }: { item: SharedBriefItem }) {
  const [expanded, setExpanded] = useState(false);
  const category = item.main_interest ?? "";

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-[18px] md:p-5">
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {category ? (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[category] ?? "bg-orange-50 border border-orange-200 text-orange-700"}`}>
            {category}
            {item.sub_interest ? ` · ${item.sub_interest}` : ""}
          </span>
        ) : null}
        <span className="ml-auto text-xs text-navy-400">
          {item.published_at ? formatDate(item.published_at) : "발행 전"}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.45rem] font-bold leading-snug break-keep text-navy-900">
            {item.title}
          </h2>
          <p className="mt-2 text-sm leading-6 break-keep text-navy-600">
            {item.short_summary}
          </p>
          {item.action_line ? (
            <p className="mt-1.5 text-sm font-semibold text-orange-600">
              {item.action_line}
              <ChevronDown className="ml-[2px] inline h-[14px] w-[14px] align-middle" aria-hidden="true" />
            </p>
          ) : null}
        </div>
        {item.thumbnail_url ? (
          <ContentThumbnail
            src={item.thumbnail_url}
            alt={item.thumbnail_alt ?? item.title}
            className="w-[80px] h-[80px] shrink-0 overflow-hidden rounded-md"
            imgClassName="w-full h-full object-cover"
            fallbackLabel="준비 중"
          />
        ) : null}
      </div>

      {item.long_summary ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-navy-500 transition hover:text-navy-700"
          >
            {expanded ? "접기" : "상세 보기"}
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          {expanded ? (
            <div className="mt-3 space-y-3 border-t border-navy-100 pt-3">
              {item.long_summary.split(/\n\n+/).map((paragraph, i) => (
                <p key={i} className="text-sm leading-6 text-navy-700">{paragraph}</p>
              ))}
              <SourceDisplay sources={item.sources} />
            </div>
          ) : null}
        </>
      ) : (
        <SourceDisplay sources={item.sources} className="mt-3" />
      )}
    </div>
  );
}
