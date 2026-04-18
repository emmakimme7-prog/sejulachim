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
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveKey(tab.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition",
              activeKey === tab.key ? "bg-gray-900 text-white" : "border border-gray-300 bg-white text-gray-800"
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
