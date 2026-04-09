"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function AccountTabs({
  tabs
}: {
  tabs: Array<{ key: string; label: string; content: React.ReactNode }>;
}) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "profile");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveKey(tab.key)}
            className={cn(
              "rounded-full px-5 py-3 text-sm font-semibold transition",
              activeKey === tab.key ? "bg-navy-900 text-white" : "border border-navy-200 bg-white text-navy-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {tabs.map((tab) => (
          <div key={tab.key} className={activeKey === tab.key ? "block" : "hidden"}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
