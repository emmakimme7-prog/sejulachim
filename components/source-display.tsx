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
        <p className="text-sm leading-6 text-gray-500">
          출처:{" "}
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 underline underline-offset-2 hover:text-gray-600"
          >
            {source.name}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-semibold text-gray-600">출처</p>

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
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
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
            className="block rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50"
          >
            {source.name}
          </a>
        ))}
      </div>
    </div>
  );
}
