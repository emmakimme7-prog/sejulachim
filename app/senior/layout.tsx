"use client";

import { FontScaleProvider } from "@/components/senior/font-scale";
import { useIsDesktop } from "@/components/senior/use-media-query";

export default function SeniorLayout({ children }: { children: React.ReactNode }) {
  return (
    <FontScaleProvider>
      <Frame>{children}</Frame>
    </FontScaleProvider>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return <div style={{ background: "#FFFBF5", minHeight: "100vh" }}>{children}</div>;
  }
  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          background: "#FFFBF5",
          minHeight: "100vh",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}
