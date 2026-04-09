import { type ContentSource } from "@/lib/content/sources";
import { renderEmailSources } from "@/lib/email/sources";

type EmailCard = {
  title: string;
  shortSummary: string;
  actionLine: string;
  sources: ContentSource[];
  mainInterest?: string;
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  건강: { bg: "#edf7f0", text: "#1a7a40", border: "#b6dfc6" },
  돈: { bg: "#fef8ec", text: "#a06000", border: "#f5d87a" },
  실생활: { bg: "#eef4fe", text: "#2457b0", border: "#b8cffa" },
  뉴스: { bg: "#fdf0f0", text: "#b53030", border: "#f5b8b8" },
  관계: { bg: "#f4effe", text: "#6030b5", border: "#ccb8fa" }
};

const DEFAULT_CATEGORY_COLOR = { bg: "#f0f4f8", text: "#35506b", border: "#c8d8e8" };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderDailyBriefEmail({
  cards,
  unsubscribeUrl,
  logoUrl
}: {
  cards: EmailCard[];
  unsubscribeUrl: string;
  logoUrl: string;
}) {
  const previewText = "꼭 알아둘 일, 생활에 도움 되는 일, 오늘 바로 해볼 일을 세줄아침으로 전해드립니다.";

  const cardsHtml = cards
    .map((card) => {
      const cat = card.mainInterest ?? "";
      const color = CATEGORY_COLORS[cat] ?? DEFAULT_CATEGORY_COLOR;
      const categoryBadge = cat
        ? `<div style="margin-bottom:16px;">
            <span style="display:inline-block;background:${color.bg};color:${color.text};border:1px solid ${color.border};font-size:12px;font-weight:700;letter-spacing:0.04em;padding:4px 12px;border-radius:100px;">${escapeHtml(cat)}</span>
           </div>`
        : "";

      const sourcesHtml = renderEmailSources(card.sources);

      return `
        <div style="background:#ffffff;border-radius:24px;padding:28px 24px;margin-bottom:16px;border:1px solid #e8e3db;box-shadow:0 2px 8px rgba(17,32,51,0.06);">
          ${categoryBadge}
          <h2 style="margin:0 0 14px;font-size:22px;line-height:1.4;color:#112033;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(card.title)}</h2>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.85;color:#2d4a5f;">${escapeHtml(card.shortSummary)}</p>
          <div style="background:#fdf5ee;border-radius:16px;padding:16px 20px;border-left:4px solid #e07c23;margin-bottom:${sourcesHtml ? "20px" : "0"};">
            <p style="margin:0;font-size:15px;line-height:1.7;color:#1a3347;font-weight:700;">${escapeHtml(card.actionLine)}</p>
          </div>
          ${sourcesHtml}
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Apple SD Gothic Neo','Noto Sans KR',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>

  <div style="max-width:600px;margin:0 auto;padding:32px 16px 52px;">

    <!-- 헤더 -->
    <div style="background:#112033;border-radius:28px;padding:36px 32px 32px;margin-bottom:20px;">
      <img src="${escapeHtml(logoUrl)}" alt="세줄아침" style="display:block;width:120px;height:auto;margin-bottom:22px;" />
      <p style="margin:0 0 8px;color:#f19a4b;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Daily Brief</p>
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.3;color:#ffffff;font-weight:800;letter-spacing:-0.02em;">오늘의 세 줄 소식</h1>
      <p style="margin:0;font-size:14px;line-height:1.8;color:#9ab8d4;">꼭 알아둘 일, 생활에 도움 되는 일,<br/>오늘 바로 해볼 일을 차분하게 전해드립니다.</p>
    </div>

    <!-- 카드 목록 -->
    ${cardsHtml}

    <!-- 구분선 -->
    <div style="border-top:1px solid #d8d0c4;margin:8px 0 24px;"></div>

    <!-- 푸터 -->
    <div style="text-align:center;">
      <img src="${escapeHtml(logoUrl)}" alt="세줄아침" style="display:block;width:80px;height:auto;margin:0 auto 12px;opacity:0.5;" />
      <p style="margin:0;color:#8a8078;font-size:13px;line-height:1.7;">
        더 이상 메일을 받고 싶지 않으시면<br/>
        <a href="${escapeHtml(unsubscribeUrl)}" style="color:#8a8078;text-decoration:underline;">수신 해지하기</a>를 눌러주세요.
      </p>
    </div>

  </div>
</body>
</html>`;
}
