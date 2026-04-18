import { Suspense } from "react";

import { ArchiveBrowser } from "@/components/archive-browser";
import { FeedCategorySidebar } from "@/components/feed-category-sidebar";
import { FeedRightSidebar } from "@/components/feed-right-sidebar";
import { HomeContent } from "@/components/home-content";
import { OAuthLinkedNotice } from "@/components/oauth-linked-notice";
import { getCurrentUserSession } from "@/lib/auth/user-session";
import { getInterestConfig } from "@/lib/content/interest-config";
import { listPublicContentItems, listTodayPreview } from "@/lib/content/public-content";
import { listUserInterestSelections } from "@/lib/mongodb/user-data";
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
  const isArchiveView = initialView === "archive";
  const isTodayView = initialView === "today";
  const featuredMode = !initialTitleQuery && !initialTopic && (!initialView || initialView === "intro") && (!initialMode || initialMode === "popular") && !isArchiveView;
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
  // 피드 상품 카드용 데이터 — DB 캐시만 조회 (API 호출 없음 → 빠르고 제한 안 걸림)
  const feedProductMap: Record<string, Awaited<ReturnType<typeof fetchPopularProductsForContent>>> = {};
  try {
    const productResults = await Promise.all(
      interestConfig.mainInterests.map(async (cat) => {
        const products = await fetchPopularProductsForContent(cat, null, 5, null, true);
        return { cat, products };
      })
    );
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

  const sidebarItems = archiveItems.slice(0, 20).map((it) => ({
    title: it.title,
    short_summary: it.short_summary,
    action_line: it.action_line,
  }));

  // 로그인 사용자의 관심분야 (사이드바 위젯용)
  let userInterests: string[] | undefined;
  try {
    const session = await getCurrentUserSession();
    if (session) {
      const interestRows = await listUserInterestSelections(session.id);
      userInterests = interestRows
        .map((row) => row.main_interest)
        .filter((v) => interestConfig.mainInterests.includes(v));
    }
  } catch {
    // 세션/DB 실패 시 조용히 미로그인 상태로 폴백
  }

  return (
    <HomeContent previews={todayPreviews}>
      <Suspense><OAuthLinkedNotice /></Suspense>
      <div className="mx-auto w-full px-[18px] lg:px-[34px] pb-10 md:pb-20" style={{ maxWidth: "min(80rem, 1536px)" }}>
        <h1 className="sr-only">세줄아침 — 매일 아침 세 줄로 읽는 생활 브리핑</h1>
        <div className="xl:grid xl:grid-cols-[220px_minmax(0,1fr)_280px] xl:gap-8">
          <aside className="hidden xl:block xl:sticky xl:top-[90px] xl:self-start">
            <Suspense>
              <FeedCategorySidebar
                categories={interestConfig.mainInterests}
                interestLabels={interestConfig.labels}
              />
            </Suspense>
          </aside>
          <main className="min-w-0">
            <Suspense fallback={<div className="min-h-[60vh]" />}>
              <ArchiveBrowser
                items={archiveItems}
                initialTitleQuery={initialTitleQuery}
                initialTopic={initialTopic}
                mainInterests={interestConfig.mainInterests}
                interestLabels={interestConfig.labels}
                subInterestOptions={interestConfig.subInterests}
                featuredMode={featuredMode}
                todayMode={isTodayView}
                initialSortOrder={featuredMode ? "popular" : "latest"}
                feedProductMap={feedProductMap}
              />
            </Suspense>
          </main>
          <aside className="hidden xl:block xl:sticky xl:top-[90px] xl:self-start">
            <FeedRightSidebar
              items={sidebarItems}
              interests={userInterests}
            />
          </aside>
        </div>
      </div>
    </HomeContent>
  );
}
