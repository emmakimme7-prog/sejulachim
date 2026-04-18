import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

import { ProductBrowser } from "@/components/product-browser";
import { getInterestConfig } from "@/lib/content/interest-config";
import { PRODUCT_CATALOG } from "@/lib/products/catalog";
import { attachAffiliateLinks } from "@/lib/products/coupang-partners";

const getCachedAffiliateProducts = unstable_cache(
  async () => attachAffiliateLinks(PRODUCT_CATALOG),
  ["affiliate-product-catalog"],
  { revalidate: 60 * 60 * 24 }
);

export const metadata: Metadata = {
  title: "상품",
  description: "세줄아침 카테고리와 세부 주제에 맞춰 살펴볼 수 있는 추천 상품 모음입니다.",
};

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string;
    subInterest?: string;
    q?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [{ category, subInterest, q }, interestConfig, affiliateProducts] = await Promise.all([
    searchParams,
    getInterestConfig(),
    getCachedAffiliateProducts(),
  ]);

  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto 24px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "#fff",
            borderRadius: 999,
            border: "1.5px solid #F5DDC2",
            fontSize: 12,
            fontWeight: 800,
            color: "#B2570F",
            marginBottom: 12,
          }}
        >
          추천 상품
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          카테고리별로 바로 이어보는 상품
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 15, color: "#7A6F62", fontWeight: 500, lineHeight: 1.6 }}>
          관심사 구조를 그대로 따라가며 관련 상품을 한눈에 살펴볼 수 있어요.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <ProductBrowser
          products={affiliateProducts}
          interestLabels={interestConfig.labels}
          subInterests={interestConfig.subInterests}
          initialCategory={category?.trim() || "전체"}
          initialSubInterest={subInterest?.trim() || "전체"}
          initialQuery={q?.trim() || ""}
        />
      </div>
    </div>
  );
}
