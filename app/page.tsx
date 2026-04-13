import { Suspense } from "react";

import { ArchiveBrowser } from "@/components/archive-browser";
import { HomeContent } from "@/components/home-content";
import { getInterestConfig } from "@/lib/content/interest-config";
import { listPublicContentItems, listTodayPreview } from "@/lib/content/public-content";
import { fetchPopularProductsForContent } from "@/lib/products/coupang-partners";

export const revalidate = 300;

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
  const featuredMode = !initialTitleQuery && !initialTopic && (!initialView || initialView === "intro") && (!initialMode || initialMode === "popular");
  const interestConfig = await getInterestConfig();
  const todayPreviews = await listTodayPreview();
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
  // 피드 상품 카드용 데이터 — 카테고리별로 미리 로드 (최대 5초, 실패 시 빈 맵)
  const feedProductMap: Record<string, Awaited<ReturnType<typeof fetchPopularProductsForContent>>> = {};
  try {
    const productResults = await Promise.race([
      Promise.all(
        interestConfig.mainInterests.map(async (cat) => {
          const products = await fetchPopularProductsForContent(cat, null, 5);
          return { cat, products };
        })
      ),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("product fetch timeout")), 5000)),
    ]);
    for (const { cat, products } of productResults) {
      feedProductMap[cat] = products;
    }
  } catch {
    // 상품 로딩 실패/타임아웃 시 빈 맵으로 진행 (페이지 렌더링 우선)
  }

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
    <HomeContent previews={todayPreviews}>
      <div className="mx-auto w-full px-[18px] lg:px-[34px] pb-10 md:pb-20" style={{ maxWidth: "min(64rem, 1536px)" }}>
        <h1 className="sr-only">세줄아침 — 매일 아침 세 줄로 읽는 생활 브리핑</h1>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
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
            feedProductMap={feedProductMap}
          />
        </Suspense>
      </div>
    </HomeContent>
  );
}
