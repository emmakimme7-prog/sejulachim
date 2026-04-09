import {
  type ContentSource,
  SOURCE_TYPE_LABELS,
  getVisibleSourceTabs,
  groupSourcesByTab
} from "@/lib/content/sources";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEmailSources(sources: ContentSource[]) {
  if (sources.length === 0) {
    return "";
  }

  const visibleTabs = getVisibleSourceTabs(sources);
  const groups = groupSourcesByTab(sources);

  if (sources.length === 1) {
    const source = sources[0];
    return `<p style="margin:0;color:#35506b;font-size:14px;">출처: <a href="${escapeHtml(source.url)}" style="color:#35506b;">${escapeHtml(source.name)}</a></p>`;
  }

  if (visibleTabs.length <= 1) {
    return `
      <div style="margin-top:12px;">
        <p style="margin:0 0 8px;color:#35506b;font-size:14px;font-weight:700;">출처</p>
        ${sources
          .map(
            (source) =>
              `<p style="margin:0 0 6px;color:#35506b;font-size:14px;">- <a href="${escapeHtml(source.url)}" style="color:#35506b;">${escapeHtml(source.name)}</a></p>`
          )
          .join("")}
      </div>
    `;
  }

  return `
    <div style="margin-top:12px;">
      <p style="margin:0 0 8px;color:#35506b;font-size:14px;font-weight:700;">출처</p>
      ${visibleTabs
        .map(
          (tab) => `
            <div style="margin-top:8px;">
              <p style="margin:0 0 6px;color:#e57c23;font-size:13px;font-weight:700;">[${SOURCE_TYPE_LABELS[tab]}]</p>
              ${groups[tab]
                .map(
                  (source) =>
                    `<p style="margin:0 0 6px;color:#35506b;font-size:14px;">- <a href="${escapeHtml(source.url)}" style="color:#35506b;">${escapeHtml(source.name)}</a></p>`
                )
                .join("")}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}
