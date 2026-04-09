import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentThumbnail } from "@/components/content-thumbnail";
import { DetailActionBar } from "@/components/detail-action-bar";
import { DetailListenButton } from "@/components/detail-listen-button";
import { RelatedProductCard } from "@/components/related-product-card";
import { SourceDisplay } from "@/components/source-display";
import { getPublicContentItemBySlug, listRelatedPublicContentItems } from "@/lib/content/public-content";
import { fetchPopularProductsForContent } from "@/lib/products/coupang-partners";
import { normalizeSources } from "@/lib/content/sources";
import { formatDate } from "@/lib/utils";

const BASE_URL = process.env.APP_URL?.trim().replace(/\/$/, "") || "https://sejulachim.studiobyyou.kr";

const CATEGORY_STYLE: Record<string, string> = {
  "실생활": "bg-blue-50 border border-blue-200 text-blue-700",
  "건강": "bg-green-50 border border-green-200 text-green-700",
  "돈": "bg-amber-50 border border-amber-200 text-amber-700",
  "뉴스": "bg-slate-50 border border-slate-200 text-slate-700",
  "관계": "bg-rose-50 border border-rose-200 text-rose-700",
};

const CATEGORY_TEXT_COLOR: Record<string, string> = {
  "실생활": "text-blue-600",
  "건강": "text-green-600",
  "돈": "text-amber-600",
  "뉴스": "text-slate-600",
  "관계": "text-rose-600",
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicContentItemBySlug(slug);
  if (!data) return {};

  const title = data.title;
  const description = data.short_summary ?? "";
  const imageUrl = ("thumbnail_url" in data && data.thumbnail_url) ? data.thumbnail_url : `${BASE_URL}/sejulachim-seo.jpg`;
  const url = `${BASE_URL}/archive/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "세줄아침",
      locale: "ko_KR",
      publishedTime: data.published_at ?? undefined,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export const revalidate = 60;

function buildDetailParagraphs(
  _shortSummary: string | null | undefined,
  longSummary: string | null | undefined
) {
  if (!longSummary?.trim()) {
    return [];
  }

  return longSummary
    .split(/\n\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export default async function ArchiveDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPublicContentItemBySlug(slug);

  if (!data) {
    notFound();
  }

  const currentCategory = data.category ?? "";
  const relatedItems = await listRelatedPublicContentItems(currentCategory, slug, 6);
  const currentSubInterest = "sub_interest" in data ? (data.sub_interest ?? null) : null;
  const relatedProducts = await fetchPopularProductsForContent(currentCategory, currentSubInterest, 3);

  const detailParagraphs = buildDetailParagraphs(
    data.short_summary,
    "long_summary" in data ? data.long_summary : null
  );
  const mobileProductTop = relatedProducts[0] ? [relatedProducts[0]] : [];
  const mobileProductMiddle = relatedProducts[1] ? [relatedProducts[1]] : [];
  const mobileProductBottom = relatedProducts[2] ? [relatedProducts[2]] : [];
  const listenText = [data.title, data.short_summary, data.action_line, ...detailParagraphs]
    .filter(Boolean)
    .join(". ");
  const nextItem = relatedItems[0] ?? null;

  const articleUrl = `${BASE_URL}/archive/${slug}`;

  const newsArticleData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: data.title,
    description: data.short_summary ?? "",
    datePublished: data.published_at ?? undefined,
    dateModified: data.published_at ?? undefined,
    author: { "@type": "Organization", name: "세줄아침", url: BASE_URL },
    publisher: {
      "@type": "Organization",
      name: "세줄아침",
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/threeline_morning_symbol.png` },
    },
    url: articleUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    ...("thumbnail_url" in data && data.thumbnail_url
      ? { image: { "@type": "ImageObject", url: data.thumbnail_url } }
      : {}),
    articleSection: data.category ?? undefined,
    inLanguage: "ko-KR",
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: data.category ?? "콘텐츠", item: `${BASE_URL}/?category=${encodeURIComponent(data.category ?? "")}` },
      { "@type": "ListItem", position: 3, name: data.title },
    ],
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleData) }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
    />
    <div className="mx-auto w-full bg-white px-[18px] lg:px-[34px] py-8 md:py-12" style={{ maxWidth: "min(64rem, 1536px)" }}>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
        <article id="article-content" className="min-w-0">
          {/* 썸네일 + 카테고리 배지 오버레이 */}
          {"thumbnail_url" in data && data.thumbnail_url ? (
            <div className="relative -mx-4 aspect-[16/9] overflow-hidden bg-gray-50 sm:mx-0 sm:rounded-xl sm:border sm:border-gray-100">
              <ContentThumbnail
                src={data.thumbnail_url}
                alt={("thumbnail_alt" in data ? data.thumbnail_alt : "") || data.title}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
                fallbackLabel="썸네일 준비 중"
              />
              <span
                className={`absolute bottom-4 left-4 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  data.category === "실생활" ? "bg-blue-50 border border-blue-200 text-blue-700" :
                  data.category === "건강" ? "bg-green-50 border border-green-200 text-green-700" :
                  data.category === "돈" ? "bg-amber-50 border border-amber-200 text-amber-700" :
                  data.category === "뉴스" ? "bg-slate-50 border border-slate-200 text-slate-700" :
                  data.category === "관계" ? "bg-rose-50 border border-rose-200 text-rose-700" :
                  "bg-orange-50 border border-orange-200 text-orange-700"
                }`}
              >
                {data.category}
                {"sub_interest" in data && data.sub_interest ? ` · ${data.sub_interest}` : ""}
              </span>
            </div>
          ) : null}

          {/* 날짜 */}
          <p className="mt-4 text-[0.82rem] text-gray-500">{data.published_at ? formatDate(data.published_at) : "발행 전"}</p>

          {/* 제목 */}
          <h1 className="mt-1 text-[1.3rem] font-bold leading-[1.35] break-keep text-gray-900 sm:text-[1.5rem] md:text-[1.8rem]">
            {data.title}
          </h1>

          {/* 요약 박스 */}
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-gray-900">📋 요약</h2>
              <DetailListenButton
                text={listenText}
                title={data.title}
                nextItems={relatedItems.map((item) => ({
                  title: item.title,
                  short_summary: "short_summary" in item ? item.short_summary : null,
                  long_summary: "long_summary" in item ? item.long_summary : null,
                  action_line: "action_line" in item ? item.action_line : null,
                  slug: item.slug,
                }))}
                className="!h-auto !p-0 !border-0 !bg-transparent !rounded-none !text-[0.82rem] !font-normal !text-gray-500 hover:!text-gray-800 !shadow-none"
              />
            </div>
            <ul className="space-y-2">
              {data.short_summary ? (
                <li className="text-sm leading-6 text-gray-700">• {data.short_summary}</li>
              ) : null}
              {"action_line" in data && data.action_line ? (
                <li className="text-sm leading-6 font-semibold text-amber-800">• {data.action_line}</li>
              ) : null}
            </ul>
          </div>

          {/* 액션바: 좋아요 / 저장 / 공유 / 글씨크기 */}
          <div className="mt-6">
            <DetailActionBar shareSlug={slug} shareTitle={data.title} />
          </div>

          {mobileProductTop.length > 0 ? (
            <div className="mt-6 xl:hidden">
              <RelatedProductCard products={mobileProductTop} hideHeading hideDisclosure />
            </div>
          ) : null}

          {detailParagraphs.length > 0 ? (
            <section className="mt-8 pt-2">
              <div className="article-body-text space-y-5 text-navy-700">
                {detailParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-navy-100 pt-6">
            <SourceDisplay sources={normalizeSources(data)} />
            {["건강", "돈"].includes(currentCategory) ? (
              <p className="shrink-0 text-sm leading-7 text-navy-400 text-right">
                ※ 본 내용은 참고용이며 전문가 상담을 권장합니다.
              </p>
            ) : null}
          </div>

          {mobileProductMiddle.length > 0 ? (
            <div className="mt-6 xl:hidden">
              <RelatedProductCard products={mobileProductMiddle} hideHeading hideDisclosure />
            </div>
          ) : null}

          {nextItem ? (
            <div className="mt-6 border-t border-navy-100 pt-6">
              <p className="text-sm font-semibold tracking-[0.16em] text-gray-400">다음 글</p>
              <Link href={`/archive/${nextItem.slug}`} className="group mt-4 block">
                <div className="rounded-xl border border-navy-100 bg-white p-[18px] transition-shadow hover:shadow-md md:p-5">
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[nextItem.category ?? ""] ?? "bg-orange-50 border border-orange-200 text-orange-700"}`}>
                      {nextItem.category}
                      {"sub_interest" in nextItem && nextItem.sub_interest ? ` · ${nextItem.sub_interest}` : ""}
                    </span>
                    <span className="ml-auto text-xs text-navy-400">
                      {nextItem.published_at ? formatDate(nextItem.published_at) : "발행 전"}
                    </span>
                  </div>
                  <div className="md:flex md:items-stretch md:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <h2 className="flex-1 md:flex-none text-[1.45rem] font-bold leading-snug break-keep text-navy-900 transition group-hover:text-orange-600">
                          {nextItem.title}
                        </h2>
                        {"thumbnail_url" in nextItem && nextItem.thumbnail_url ? (
                          <ContentThumbnail
                            src={nextItem.thumbnail_url}
                            alt={("thumbnail_alt" in nextItem ? nextItem.thumbnail_alt : "") || nextItem.title}
                            className="w-[80px] h-[80px] shrink-0 overflow-hidden rounded-md md:hidden"
                            imgClassName="w-full h-full object-cover"
                            fallbackLabel="준비 중"
                          />
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 break-keep text-navy-600">
                        {nextItem.short_summary}
                      </p>
                      {"action_line" in nextItem && nextItem.action_line ? (
                        <p className="mt-1.5 text-sm font-semibold text-orange-600">
                          {nextItem.action_line}
                          <ChevronRight className="ml-[2px] inline h-[14px] w-[14px] align-middle" aria-hidden="true" />
                        </p>
                      ) : null}
                    </div>
                    {"thumbnail_url" in nextItem && nextItem.thumbnail_url ? (
                      <ContentThumbnail
                        src={nextItem.thumbnail_url}
                        alt={("thumbnail_alt" in nextItem ? nextItem.thumbnail_alt : "") || nextItem.title}
                        className="hidden md:block w-28 min-h-[6rem] shrink-0 overflow-hidden rounded-md"
                        imgClassName="w-full h-full object-cover"
                        fallbackLabel="준비 중"
                      />
                    ) : null}
                  </div>
                </div>
              </Link>
            </div>
          ) : null}

          {mobileProductBottom.length > 0 ? (
            <div className="mt-6 xl:hidden">
              <RelatedProductCard products={mobileProductBottom} hideHeading />
            </div>
          ) : null}

          <div className={relatedItems.length > 0 ? "mt-6 border-t border-navy-100 pt-6 xl:hidden" : "hidden"}>
            <p className="text-sm font-semibold tracking-[0.16em] text-gray-400">관련 콘텐츠</p>
            <div className="mt-4 space-y-3">
              {relatedItems.length > 0 ? (
                relatedItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/archive/${item.slug}`}
                    className="block border-b border-navy-100 py-4 first:pt-0 last:border-b-0 last:pb-0 transition hover:opacity-80"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${CATEGORY_TEXT_COLOR[item.category ?? ""] ?? "text-orange-500"}`}>
                          {item.category}
                          {"sub_interest" in item && item.sub_interest ? ` · ${item.sub_interest}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-bold leading-5 text-navy-900">{item.title}</p>
                      </div>
                      {"thumbnail_url" in item && item.thumbnail_url ? (
                        <ContentThumbnail
                          src={item.thumbnail_url}
                          alt={("thumbnail_alt" in item ? item.thumbnail_alt : "") || item.title}
                          className="w-16 shrink-0 self-start overflow-hidden rounded-[10px]"
                          imgClassName="aspect-square w-full object-cover"
                          fallbackLabel="준비 중"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-5 text-navy-600">{item.short_summary}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-7 text-navy-600">같은 관심사에서 이어서 볼 만한 콘텐츠를 준비 중입니다.</p>
              )}
            </div>
          </div>
        </article>

        <aside className="hidden space-y-4 xl:sticky xl:top-24 xl:block xl:self-start">
          <RelatedProductCard products={relatedProducts} />

          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-gray-400">관련 콘텐츠</p>
            <div className="mt-4 space-y-3">
              {relatedItems.length > 0 ? (
                relatedItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/archive/${item.slug}`}
                    className="block border-b border-navy-100 py-4 first:pt-0 last:border-b-0 last:pb-0 transition hover:opacity-80"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${CATEGORY_TEXT_COLOR[item.category ?? ""] ?? "text-orange-500"}`}>
                          {item.category}
                          {"sub_interest" in item && item.sub_interest ? ` · ${item.sub_interest}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-bold leading-5 text-navy-900">{item.title}</p>
                      </div>
                      {"thumbnail_url" in item && item.thumbnail_url ? (
                        <ContentThumbnail
                          src={item.thumbnail_url}
                          alt={("thumbnail_alt" in item ? item.thumbnail_alt : "") || item.title}
                          className="w-16 shrink-0 self-start overflow-hidden rounded-[10px]"
                          imgClassName="aspect-square w-full object-cover"
                          fallbackLabel="준비 중"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-5 text-navy-600">{item.short_summary}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-7 text-navy-600">같은 관심사에서 이어서 볼 만한 콘텐츠를 준비 중입니다.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}
