"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { PRODUCT_DISCLOSURE, type ProductCatalogItem } from "@/lib/products/catalog";
import { cn } from "@/lib/utils";

type ProductBrowserProps = {
  products: ProductCatalogItem[];
  interestLabels: Record<string, string>;
  subInterests: Record<string, string[]>;
  initialCategory?: string;
  initialSubInterest?: string;
  initialQuery?: string;
};

export function ProductBrowser({
  products,
  interestLabels,
  subInterests,
  initialCategory = "전체",
  initialSubInterest = "전체",
  initialQuery = ""
}: ProductBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubInterest, setSelectedSubInterest] = useState(initialSubInterest);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);

  const availableCategories = useMemo(
    () => ["전체", ...Array.from(new Set(products.map((item) => item.category)))],
    [products]
  );

  const availableSubInterests = useMemo(() => {
    if (selectedCategory === "전체") {
      return ["전체"];
    }

    const configured = subInterests[selectedCategory] ?? [];
    const inCatalog = products
      .filter((item) => item.category === selectedCategory)
      .map((item) => item.subInterest)
      .filter((item): item is string => Boolean(item));

    return ["전체", ...Array.from(new Set([...configured, ...inCatalog]))];
  }, [products, selectedCategory, subInterests]);

  const filteredProducts = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();

    return products.filter((item) => {
      const matchesCategory = selectedCategory === "전체" || item.category === selectedCategory;
      const matchesSubInterest =
        selectedSubInterest === "전체" || (item.subInterest ?? "") === selectedSubInterest;
      const haystack = [
        item.title,
        item.description,
        item.reason,
        item.category,
        item.subInterest,
        item.searchKeyword,
        item.badge
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && matchesSubInterest && (needle.length === 0 || haystack.includes(needle));
    });
  }, [deferredQuery, products, selectedCategory, selectedSubInterest]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-navy-100 bg-white p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-navy-500">카테고리</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedSubInterest("전체");
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    selectedCategory === category
                      ? "bg-navy-900 text-white"
                      : "border border-navy-200 bg-white text-navy-800"
                  )}
                >
                  {category === "전체" ? "전체" : interestLabels[category] ?? category}
                </button>
              ))}
            </div>

            {selectedCategory !== "전체" ? (
              <>
                <p className="mt-5 text-sm font-semibold text-navy-500">세부 카테고리</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableSubInterests.map((subInterest) => (
                    <button
                      key={subInterest}
                      type="button"
                      onClick={() => setSelectedSubInterest(subInterest)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        selectedSubInterest === subInterest
                          ? "bg-orange-500 text-white"
                          : "border border-orange-100 bg-orange-50 text-orange-600"
                      )}
                    >
                      {subInterest}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-semibold text-navy-500">상품 검색</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="상품명, 설명, 키워드로 찾아보세요"
              className="mt-3 min-h-14 w-full rounded-[24px] border border-navy-200 px-5 text-base text-navy-900 outline-none transition focus:border-orange-300"
            />
            <p className="mt-3 text-sm leading-6 text-navy-500">{PRODUCT_DISCLOSURE}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((item) => (
          <article key={item.id} className="rounded-[28px] border border-navy-100 bg-white p-6 shadow-[0_20px_44px_rgba(17,32,51,0.06)]">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
                {interestLabels[item.category] ?? item.category}
              </span>
              {item.subInterest ? (
                <span className="rounded-full bg-navy-50 px-3 py-1 text-sm font-semibold text-navy-600">{item.subInterest}</span>
              ) : null}
              <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold text-navy-600">{item.badge}</span>
            </div>

            <h2 className="mt-4 text-2xl font-bold leading-8 text-navy-900">{item.title}</h2>
            <p className="mt-3 text-base leading-7 text-navy-700">{item.description}</p>
            <p className="mt-4 rounded-[20px] bg-navy-50 px-4 py-3 text-sm leading-6 text-navy-700">{item.reason}</p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-navy-500">추천 키워드 · {item.searchKeyword}</p>
              <Link
                href={item.linkUrl}
                target="_blank"
                rel="noreferrer sponsored"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-navy-900 px-5 text-sm font-semibold text-white transition hover:bg-navy-700"
              >
                상품 보기
              </Link>
            </div>
          </article>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-navy-200 bg-white p-6 text-base leading-7 text-navy-600">
          조건에 맞는 상품이 아직 없습니다. 검색어를 바꾸거나 다른 카테고리를 선택해보세요.
        </div>
      ) : null}
    </div>
  );
}
