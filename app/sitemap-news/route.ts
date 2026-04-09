import { NextResponse } from "next/server";
import { listPublicContentItems } from "@/lib/content/public-content";

const BASE_URL = process.env.APP_URL?.trim().replace(/\/$/, "") || "https://sejulachim.studiobyyou.kr";

export const revalidate = 3600;

export async function GET() {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  let articles: Array<{ slug: string; title: string; published_at: string | null; category?: string }> = [];

  try {
    const items = await listPublicContentItems(100);
    articles = items.filter(
      (item) => item.published_at && new Date(item.published_at) >= twoDaysAgo
    );
  } catch {
    /* empty fallback */
  }

  const urlEntries = articles
    .map((item) => {
      const pubDate = item.published_at ? new Date(item.published_at).toISOString() : new Date().toISOString();
      return `  <url>
    <loc>${BASE_URL}/archive/${item.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>세줄아침</news:name>
        <news:language>ko</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
