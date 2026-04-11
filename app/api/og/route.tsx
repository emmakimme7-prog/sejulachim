import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { getPublicContentItemBySlug } from "@/lib/content/public-content";

export const runtime = "edge";

const CATEGORY_COLOR: Record<string, string> = {
  "실생활": "#2563eb",
  "건강": "#16a34a",
  "돈": "#d97706",
  "뉴스": "#475569",
  "관계": "#e11d48",
};

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const data = await getPublicContentItemBySlug(slug);

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const category = data.category ?? "";
  const subInterest = "sub_interest" in data ? (data.sub_interest ?? "") : "";
  const categoryLabel = subInterest ? `${category} · ${subInterest}` : category;
  const accentColor = CATEGORY_COLOR[category] ?? "#e57c23";
  const summary = data.short_summary ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #fffdf9 0%, #f7f4ef 100%)",
          padding: "60px 64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* 상단: 카테고리 뱃지 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: accentColor,
              color: "#fff",
              fontSize: "24px",
              fontWeight: 700,
              padding: "8px 24px",
              borderRadius: "999px",
            }}
          >
            {categoryLabel}
          </div>
        </div>

        {/* 중앙: 제목 + 요약 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, justifyContent: "center" }}>
          <div
            style={{
              fontSize: "52px",
              fontWeight: 800,
              color: "#112033",
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {data.title}
          </div>
          {summary ? (
            <div
              style={{
                fontSize: "28px",
                color: "#475569",
                lineHeight: 1.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {summary}
            </div>
          ) : null}
        </div>

        {/* 하단: 브랜드 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#112033",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "20px",
                fontWeight: 800,
              }}
            >
              S
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#112033" }}>
              세줄아침
            </div>
          </div>
          <div style={{ fontSize: "22px", color: "#94a3b8" }}>
            sejulachim.studiobyyou.kr
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
