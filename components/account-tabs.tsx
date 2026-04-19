"use client";

import { useState } from "react";

export function AccountTabs({
  tabs
}: {
  tabs: Array<{ key: string; label: string; content: React.ReactNode }>;
}) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "profile");

  return (
    <div className="space-y-4">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabs.map((tab) => {
          const on = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveKey(tab.key)}
              style={{
                flex: "0 0 auto",
                minHeight: 48,
                padding: "0 20px",
                borderRadius: 12,
                background: on ? "#1F1A14" : "#fff",
                color: on ? "#fff" : "#4A4037",
                border: on ? "none" : "1.5px solid #E8DCC7",
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {tab.label}
            </button>
          );
        })}
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
