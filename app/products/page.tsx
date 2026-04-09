import type { Metadata } from "next";

import { ProductBrowser } from "@/components/product-browser";
import { PageIntro } from "@/components/ui/panel";
import { getInterestConfig } from "@/lib/content/interest-config";
import { PRODUCT_CATALOG } from "@/lib/products/catalog";
import { attachAffiliateLinks } from "@/lib/products/coupang-partners";

export const metadata: Metadata = {
  title: "상품",
  description: "세줄아침 카테고리와 세부 주제에 맞춰 살펴볼 수 있는 추천 상품 모음입니다."
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
    attachAffiliateLinks(PRODUCT_CATALOG)
  ]);

  return (
    <div className="hero-bg">
      <div className="app-shell section-block">
        <PageIntro
          eyebrow="SHOP"
          title="카테고리별로 바로 이어보는 상품"
          description="세줄아침의 관심사 구조를 그대로 따라가며 관련 상품을 한눈에 살펴볼 수 있게 정리했습니다. 카테고리와 세부 카테고리로 좁혀보고, 검색으로 필요한 상품만 빠르게 찾을 수 있습니다."
          className="mb-8 md:mb-10"
        />

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
