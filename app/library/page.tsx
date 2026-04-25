import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LibraryBrowser } from "@/components/library-browser";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { getCurrentUserSession } from "@/lib/auth/user-session";
import { getInterestConfig } from "@/lib/content/interest-config";
import { hasSupabaseServerEnv } from "@/lib/env";
import { listUserFavoriteContentItems, listUserSharedLinks } from "@/lib/mongodb/content-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getCurrentUserSession();
  if (!session) {
    redirect("/login");
  }

  const interestConfig = await getInterestConfig();
  const [favorites, shareRecords, archiveItems] = hasSupabaseServerEnv()
    ? await (async () => {
        const supabase = createAdminSupabaseClient();
        const [archiveRows, favoriteItems, shareItems] = await Promise.all([
          supabase
            .from('sj_content_items')
            .select("*")
            .eq("approval_status", "approved")
            .or("summary_status.eq.done,ai_status.eq.completed")
            .not("published_at", "is", null)
            .order("published_at", { ascending: false }),
          listUserFavoriteContentItems(session.id),
          listUserSharedLinks(session.id)
        ]);

        const archiveItems = archiveRows.data ?? [];
        return [favoriteItems, shareItems, archiveItems] as const;
      })()
    : [[], [], []] as const;
  type ArchiveMapItem = {
    slug: string;
    title: string;
    category?: string | null;
    sub_interest?: string | null;
  };
  const typedArchiveItems = archiveItems as ArchiveMapItem[];

  const archiveMap = new Map(typedArchiveItems.map((item) => [item.slug, item]));
  const shares = shareRecords.map((record) => ({
    share_key: record.share_key,
    created_at: record.created_at,
    view_count: record.view_count,
    comment_count: "comment_count" in record ? Number(record.comment_count ?? 0) : 0,
    items: record.slugs
      .map((slug: string) => archiveMap.get(slug))
      .filter((item: ArchiveMapItem | undefined): item is ArchiveMapItem => Boolean(item))
      .map((item: ArchiveMapItem) => ({
        title: item.title,
        category: item.category ?? "",
        sub_interest: item.sub_interest ?? null
      }))
  }));

  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto 24px" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          내 서재
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 15, color: "#7A6F62", fontWeight: 500, lineHeight: 1.6 }}>
          저장한 소식과 공유한 항목을 한곳에서 다시 볼 수 있어요
        </p>
      </div>
      <LibraryBrowser
        favorites={favorites.map((item) => ({
          id: item.id,
          slug: "slug" in item ? String(item.slug ?? "") : "",
          title: item.title,
          short_summary: item.short_summary ?? "",
          action_line: "action_line" in item ? (item.action_line as string | null) ?? null : null,
          sources: item.sources ?? [],
          published_at: item.published_at,
          category: item.category,
          sub_interest: item.sub_interest ?? null,
          thumbnail_url: "thumbnail_url" in item ? (item.thumbnail_url as string | null) : null
        }))}
        shares={shares}
        interestLabels={interestConfig.labels}
      />
    </div>
  );
}
