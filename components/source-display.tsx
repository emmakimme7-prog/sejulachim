"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type ContentSource,
  type SourceTabKey,
  SOURCE_TYPE_LABELS,
  getDefaultSourceTab,
  getVisibleSourceTabs,
  groupSourcesByTab
} from "@/lib/content/sources";
import { cn } from "@/lib/utils";

export function SourceDisplay({
  sources,
  className
}: {
  sources: ContentSource[];
  className?: string;
}) {
  const groups = useMemo(() => groupSourcesByTab(sources), [sources]);
  const visibleTabs = useMemo(() => getVisibleSourceTabs(sources), [sources]);
  const defaultTab = useMemo(() => getDefaultSourceTab(sources), [sources]);
  const [activeTab, setActiveTab] = useState<SourceTabKey | null>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  if (sources.length === 0) {
    return null;
  }

  const singleGroup = visibleTabs.length <= 1;
  const visibleSources = singleGroup ? sources : activeTab ? groups[activeTab] : sources;

  if (sources.length === 1) {
    const source = sources[0];

    return (
      <div className={className}>
        <p className="text-sm leading-6 text-navy-400">
          출처:{" "}
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-navy-400 underline underline-offset-2 hover:text-navy-600"
          >
            {source.name}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-semibold text-navy-500">출처</p>

      {!singleGroup ? (
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                activeTab === tab
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-navy-200 bg-white text-navy-700 hover:border-navy-300 hover:bg-navy-50"
              )}
            >
              {SOURCE_TYPE_LABELS[tab]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {!singleGroup && activeTab ? (
          <p className="text-sm font-semibold text-orange-500">{SOURCE_TYPE_LABELS[activeTab]}</p>
        ) : null}
        {visibleSources.map((source) => (
          <a
            key={`${source.type}-${source.name}-${source.url}`}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-navy-100 bg-white px-4 py-3 text-base font-semibold text-navy-800 transition hover:border-navy-300 hover:bg-navy-50"
          >
            {source.name}
          </a>
        ))}
      </div>
    </div>
  );
}
