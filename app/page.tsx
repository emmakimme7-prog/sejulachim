import { ArchiveBrowser } from "@/components/archive-browser";
import { getInterestConfig } from "@/lib/content/interest-config";
import { listPublicContentItems } from "@/lib/content/public-content";

export const revalidate = 60;

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; category?: string; mode?: string; view?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialTitleQuery = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";
  const initialTopic = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category.trim() : "";
  const initialMode = typeof resolvedSearchParams.mode === "string" ? resolvedSearchParams.mode.trim() : "";
  const initialView = typeof resolvedSearchParams.view === "string" ? resolvedSearchParams.view.trim() : "";
  const featuredMode = !initialTitleQuery && !initialTopic && !initialView && (!initialMode || initialMode === "popular");
  const interestConfig = await getInterestConfig();
  const data = (await listPublicContentItems(120)) as Array<{
    id: string;
    title: string;
    short_summary: string;
    action_line?: string | null;
    summary_type?: string;
    slug: string;
    published_at: string | null;
    category?: string;
    sub_interest?: string | null;
    thumbnail_url?: string | null;
    thumbnail_alt?: string | null;
    thumbnail_page_url?: string | null;
    thumbnail_license?: string | null;
    view_count?: number | null;
    main_interest?: string;
  }>;
  const archiveItems = data.map((item) => ({
      ...item,
      action_line: item.action_line ?? "",
      summary_type: item.summary_type ?? "USEFUL",
      main_interest: ("category" in item ? item.category || interestConfig.mainInterests[0] || "뉴스" : item.main_interest) ?? interestConfig.mainInterests[0] ?? "뉴스",
      sub_interest: "sub_interest" in item ? item.sub_interest ?? null : null,
      thumbnail_url: "thumbnail_url" in item ? item.thumbnail_url ?? null : null,
      thumbnail_alt: "thumbnail_alt" in item ? item.thumbnail_alt ?? null : null,
      thumbnail_page_url: "thumbnail_page_url" in item ? item.thumbnail_page_url ?? null : null,
      thumbnail_license: "thumbnail_license" in item ? item.thumbnail_license ?? null : null,
      view_count: "view_count" in item ? item.view_count ?? 0 : 0
    }));

  return (
    <div className="mx-auto w-full px-[18px] lg:px-[34px] pb-10 md:pb-20" style={{ maxWidth: "min(64rem, 1536px)" }}>
      <h1 className="sr-only">세줄아침 — 매일 아침 세 줄로 읽는 생활 브리핑</h1>
      <ArchiveBrowser
        items={archiveItems}
        initialTitleQuery={initialTitleQuery}
        initialTopic={initialTopic}
        mainInterests={interestConfig.mainInterests}
        interestLabels={interestConfig.labels}
        subInterestOptions={interestConfig.subInterests}
        featuredMode={featuredMode}
        todayMode={initialView === "today"}
        initialSortOrder={featuredMode ? "popular" : "latest"}
      />
    </div>
  );
}
