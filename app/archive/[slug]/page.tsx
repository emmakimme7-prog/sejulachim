import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentThumbnail } from "@/components/content-thumbnail";
import { DetailActionBar } from "@/components/detail-action-bar";
import { DetailListenButton } from "@/components/detail-listen-button";
import { ProductGridCard } from "@/components/product-grid-card";
import { RelatedProductCard } from "@/components/related-product-card";
import { SourceDisplay } from "@/components/source-display";
import { getPublicContentItemBySlug, listRelatedPublicContentItems } from "@/lib/content/public-content";
import { fetchPopularProductsForContent } from "@/lib/products/coupang-partners";
import { PRODUCT_DISCLOSURE } from "@/lib/products/catalog";
import { normalizeSources } from "@/lib/content/sources";
import { formatDate } from "@/lib/utils";

const BASE_URL = process.env.APP_URL?.trim().replace(/\/$/, "") || "https://sejulachim.studiobyyou.kr";

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF" },
};

function getCategoryMeta(cat: string | null | undefined) {
  if (!cat) return { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };
  return CATEGORY_META[cat] ?? { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };
}

function CategoryPlaceholder({
  cat,
  size = 96,
  rounded = 14,
  aspect = false,
}: {
  cat: string | null | undefined;
  size?: number;
  rounded?: number;
  aspect?: boolean;
}) {
  const m = getCategoryMeta(cat);
  const stripe = `repeating-linear-gradient(135deg, ${m.color}14 0 8px, transparent 8px 16px)`;
  return (
    <div
      style={{
        width: aspect ? "100%" : size,
        height: aspect ? undefined : size,
        aspectRatio: aspect ? "16 / 9" : undefined,
        borderRadius: rounded,
        background: m.bg,
        backgroundImage: stripe,
        border: `1px solid ${m.color}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: Math.round(size * 0.5),
      }}
      aria-hidden="true"
    >
      {m.emoji}
    </div>
  );
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicContentItemBySlug(slug);
  if (!data) return {};

  const title = data.title;
  const description = data.short_summary ?? "";
  const ogImageUrl = `${BASE_URL}/api/og?slug=${encodeURIComponent(slug)}`;
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
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export const revalidate = 300;

function buildDetailParagraphs(
  shortSummary: string | null | undefined,
  longSummary: string | null | undefined
) {
  const text = longSummary?.trim() || shortSummary?.trim() || "";
  if (!text) return [];

  return text
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
  let allProducts: Awaited<ReturnType<typeof fetchPopularProductsForContent>> = [];
  try {
    allProducts = await Promise.race([
      fetchPopularProductsForContent(currentCategory, currentSubInterest, 8, data.title, true),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("product fetch timeout")), 5000)),
    ]);
  } catch {
    // 상품 로딩 실패/타임아웃 시 빈 배열로 진행
  }
  const relatedProducts = allProducts.slice(0, 3);
  const bottomProducts = allProducts.slice(3, 8);

  const detailParagraphs = buildDetailParagraphs(
    data.short_summary,
    "long_summary" in data ? data.long_summary : null
  );
  const actionLineProductLink = relatedProducts[0]
    ? (() => {
        const actionText = (data.action_line ?? "").toLowerCase();
        const keyword = relatedProducts[0].sourceKeyword?.toLowerCase() ?? "";
        return keyword && actionText.includes(keyword) ? relatedProducts[0].linkUrl : null;
      })()
    : null;
  const listenText = [data.title, data.short_summary, data.action_line, ...detailParagraphs]
    .filter(Boolean)
    .join(". ");
  const nextItem = relatedItems[0] ?? null;

  const articleUrl = `${BASE_URL}/archive/${slug}`;
  const meta = getCategoryMeta(currentCategory);
  const subLabel = "sub_interest" in data && data.sub_interest ? data.sub_interest : null;

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />

      <div style={{ background: "#FFFBF5", minHeight: "100vh" }}>
        <p
          style={{
            fontSize: 10,
            color: "#9C907F",
            textAlign: "center",
            background: "#F5EEE2",
            padding: "4px 0",
            margin: 0,
            lineHeight: "14px",
          }}
        >
          {PRODUCT_DISCLOSURE}
        </p>

        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "24px 20px 60px",
            display: "grid",
            gap: 32,
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
          className="xl:!grid-cols-[minmax(0,1fr)_320px] xl:!gap-12 xl:!px-9"
        >
          <article id="article-content" style={{ minWidth: 0 }}>
            {/* 브레드크럼 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                fontSize: 13,
                color: "#7A6F62",
                fontWeight: 700,
              }}
            >
              <Link href="/" style={{ color: "#7A6F62", textDecoration: "none" }}>
                오늘의 소식
              </Link>
              <span style={{ color: "#D9CDB8" }}>/</span>
              <span style={{ color: "#B2570F", fontWeight: 800 }}>{currentCategory || "콘텐츠"}</span>
            </div>

            {/* 카테고리 배지 */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 999,
                background: meta.bg,
                color: meta.color,
                fontSize: 14,
                fontWeight: 800,
                marginBottom: 14,
                letterSpacing: "-0.01em",
              }}
            >
              <span style={{ fontSize: 18 }}>{meta.emoji}</span>
              {currentCategory}
              {subLabel ? ` · ${subLabel}` : ""}
            </div>

            {/* 제목 */}
            <h1
              style={{
                margin: "0 0 14px",
                fontSize: 28,
                fontWeight: 900,
                color: "#1F1A14",
                letterSpacing: "-0.035em",
                lineHeight: 1.25,
              }}
              className="md:!text-[38px] xl:!text-[44px]"
            >
              {data.title}
            </h1>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
                fontSize: 13,
                color: "#7A6F62",
                fontWeight: 600,
              }}
            >
              <span>{data.published_at ? formatDate(data.published_at) : "발행 전"}</span>
            </div>

            {/* 히어로 썸네일 */}
            <div style={{ marginBottom: 24 }}>
              {"thumbnail_url" in data && data.thumbnail_url ? (
                <div
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    aspectRatio: "16 / 9",
                    background: "#F5EEE2",
                    border: "1px solid #F2E6D7",
                  }}
                >
                  <ContentThumbnail
                    src={data.thumbnail_url}
                    alt={("thumbnail_alt" in data ? data.thumbnail_alt : "") || data.title}
                    className="h-full w-full"
                    imgClassName="h-full w-full object-cover"
                    fallbackLabel="썸네일 준비 중"
                  />
                </div>
              ) : (
                <CategoryPlaceholder cat={currentCategory} aspect rounded={20} size={320} />
              )}
            </div>

            {/* 큰 듣기 플레이어 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: 20,
                borderRadius: 18,
                background: "#fff",
                border: "2px solid #FFD1A3",
                marginBottom: 16,
                boxShadow: "0 2px 8px rgba(229, 124, 35, 0.08)",
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <DetailListenButton
                  text={listenText}
                  title={data.title}
                  iconOnly
                  playIcon
                  nextItems={relatedItems.map((item) => ({
                    title: item.title,
                    short_summary: "short_summary" in item ? item.short_summary : null,
                    long_summary: "long_summary" in item ? item.long_summary : null,
                    action_line: "action_line" in item ? item.action_line : null,
                    slug: item.slug,
                  }))}
                  className="!w-[60px] !h-[60px] !min-h-0 !p-0 !rounded-full !bg-[#E57C23] hover:!bg-[#D16612] !border-0 !text-white !shadow-[0_6px_16px_rgba(229,124,35,0.35)] flex items-center justify-center"
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#B2570F",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  오디오로 듣기
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    color: "#1F1A14",
                    letterSpacing: "-0.02em",
                    marginBottom: 10,
                  }}
                >
                  전체 내용 듣기
                </div>
                <div
                  style={{
                    height: 6,
                    background: "#F5EEE2",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                  aria-hidden="true"
                >
                  <div style={{ width: "0%", height: "100%", background: "#E57C23", transition: "width 0.2s" }} />
                </div>
              </div>
            </div>

            {/* 좋아요 / 공유 */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
              <DetailActionBar shareSlug={slug} shareTitle={data.title} />
            </div>

            {/* 세줄 요약 (short_summary) */}
            {data.short_summary ? (
              <div
                style={{
                  background: "linear-gradient(180deg, #FFF8EC 0%, #FFFBF5 100%)",
                  border: "1px solid #F2D7B5",
                  borderRadius: 20,
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1F1A14",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.65,
                    whiteSpace: "pre-line",
                  }}
                >
                  {data.short_summary}
                </p>
              </div>
            ) : null}

            {/* 오늘 할 수 있는 실천 */}
            {"action_line" in data && data.action_line ? (
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid #F2E6D7",
                  borderRadius: 18,
                  padding: 20,
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: "#1F1A14",
                    letterSpacing: "-0.02em",
                    marginBottom: 12,
                  }}
                >
                  🌱 오늘 할 수 있는 실천
                </div>
                {actionLineProductLink ? (
                  <a
                    href={actionLineProductLink}
                    target="_blank"
                    rel="noopener sponsored"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "#FFF2E3",
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#B2570F",
                      letterSpacing: "-0.01em",
                      textDecoration: "none",
                    }}
                  >
                    ✓ {data.action_line} →
                  </a>
                ) : (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "#FFF2E3",
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#B2570F",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    ✓ {data.action_line}
                  </div>
                )}
              </div>
            ) : null}

            {/* 모바일 상품 3-grid (XL 이상에서는 사이드바에 표시) */}
            {relatedProducts.length > 0 ? (
              <div className="xl:hidden" style={{ marginBottom: 28 }}>
                <ProductGridCard products={relatedProducts} />
              </div>
            ) : null}

            {/* 본문 */}
            {detailParagraphs.length > 0 ? (
              <section
                style={{
                  fontSize: 17,
                  lineHeight: 1.85,
                  color: "#2A241D",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                }}
              >
                {detailParagraphs.map((paragraph) => (
                  <p key={paragraph} style={{ margin: "0 0 20px" }}>
                    {paragraph}
                  </p>
                ))}
              </section>
            ) : null}

            {/* 출처 + 면책 */}
            <div
              style={{
                marginTop: 28,
                paddingTop: 20,
                borderTop: "1px solid #F2E6D7",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <SourceDisplay sources={normalizeSources(data)} />
              {["건강", "돈"].includes(currentCategory) ? (
                <p style={{ margin: 0, fontSize: 13, color: "#9C907F", fontWeight: 500, textAlign: "right" }}>
                  ※ 본 내용은 참고용이며 전문가 상담을 권장합니다.
                </p>
              ) : null}
            </div>

            {/* 하단 쿠팡 상품 */}
            {bottomProducts.length > 0 ? (
              <div style={{ marginTop: 28 }}>
                <ProductGridCard products={bottomProducts} />
              </div>
            ) : null}

            {/* 다음 글 */}
            {nextItem ? (
              <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid #F2E6D7" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#7A6F62",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  다음 글
                </div>
                <Link
                  href={`/archive/${nextItem.slug}`}
                  style={{
                    display: "block",
                    background: "#fff",
                    borderRadius: 16,
                    border: "1.5px solid #F2E6D7",
                    padding: 18,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {(() => {
                    const nm = getCategoryMeta(nextItem.category ?? "");
                    return (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 12px",
                              borderRadius: 999,
                              background: nm.bg,
                              color: nm.color,
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            <span>{nm.emoji}</span>
                            {nextItem.category}
                            {"sub_interest" in nextItem && nextItem.sub_interest ? ` · ${nextItem.sub_interest}` : ""}
                          </span>
                          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9C907F", fontWeight: 600 }}>
                            {nextItem.published_at ? formatDate(nextItem.published_at) : "발행 전"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h2
                              style={{
                                margin: 0,
                                fontSize: 19,
                                fontWeight: 900,
                                color: "#1F1A14",
                                letterSpacing: "-0.02em",
                                lineHeight: 1.35,
                                marginBottom: 6,
                              }}
                            >
                              {nextItem.title}
                            </h2>
                            <p style={{ margin: 0, fontSize: 14, color: "#4A4037", fontWeight: 500, lineHeight: 1.55 }}>
                              {nextItem.short_summary}
                            </p>
                          </div>
                          {"thumbnail_url" in nextItem && nextItem.thumbnail_url ? (
                            <ContentThumbnail
                              src={nextItem.thumbnail_url}
                              alt={("thumbnail_alt" in nextItem ? nextItem.thumbnail_alt : "") || nextItem.title}
                              className="w-24 h-24 shrink-0 overflow-hidden rounded-xl"
                              imgClassName="w-full h-full object-cover"
                              fallbackLabel="준비 중"
                            />
                          ) : (
                            <CategoryPlaceholder cat={nextItem.category} size={96} />
                          )}
                        </div>
                      </>
                    );
                  })()}
                </Link>
              </div>
            ) : null}

            {/* 관련 소식 — 모바일 (XL 이상은 사이드바) */}
            {relatedItems.length > 0 ? (
              <div className="xl:hidden" style={{ marginTop: 36 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: "#1F1A14",
                    letterSpacing: "-0.02em",
                    marginBottom: 14,
                  }}
                >
                  이 소식과 함께 보세요
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {relatedItems.map((item) => {
                    const rm = getCategoryMeta(item.category ?? "");
                    return (
                      <Link
                        key={item.slug}
                        href={`/archive/${item.slug}`}
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: 14,
                          border: "1.5px solid #F2E6D7",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {"thumbnail_url" in item && item.thumbnail_url ? (
                          <ContentThumbnail
                            src={item.thumbnail_url}
                            alt={("thumbnail_alt" in item ? item.thumbnail_alt : "") || item.title}
                            className="w-16 h-16 shrink-0 overflow-hidden rounded-xl"
                            imgClassName="w-full h-full object-cover"
                            fallbackLabel="준비 중"
                          />
                        ) : (
                          <CategoryPlaceholder cat={item.category} size={64} rounded={12} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 8px",
                              borderRadius: 999,
                              background: rm.bg,
                              color: rm.color,
                              fontSize: 11,
                              fontWeight: 800,
                              marginBottom: 4,
                            }}
                          >
                            {rm.emoji} {item.category}
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "#1F1A14",
                              letterSpacing: "-0.01em",
                              lineHeight: 1.4,
                            }}
                          >
                            {item.title}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </article>

          {/* PC 사이드바 */}
          <aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start" style={{ minWidth: 0 }}>
            <div style={{ display: "grid", gap: 16 }}>
              <RelatedProductCard products={relatedProducts} />

              {relatedItems.length > 0 ? (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 18,
                    border: "1.5px solid #F2E6D7",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#7A6F62",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: 14,
                    }}
                  >
                    이 소식과 함께 보세요
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {relatedItems.map((item, i) => {
                      const rm = getCategoryMeta(item.category ?? "");
                      return (
                        <Link
                          key={item.slug}
                          href={`/archive/${item.slug}`}
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                            paddingBottom: 12,
                            borderBottom: i < relatedItems.length - 1 ? "1px solid #F5EEE2" : "none",
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          {"thumbnail_url" in item && item.thumbnail_url ? (
                            <ContentThumbnail
                              src={item.thumbnail_url}
                              alt={("thumbnail_alt" in item ? item.thumbnail_alt : "") || item.title}
                              className="w-14 h-14 shrink-0 overflow-hidden rounded-xl"
                              imgClassName="w-full h-full object-cover"
                              fallbackLabel="준비 중"
                            />
                          ) : (
                            <CategoryPlaceholder cat={item.category} size={56} rounded={12} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: 10,
                                fontWeight: 800,
                                color: rm.color,
                                marginBottom: 4,
                              }}
                            >
                              {rm.emoji} {item.category}
                            </span>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "#1F1A14",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.title}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
