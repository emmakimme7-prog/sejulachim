import Link from "next/link";

import { PRODUCT_DISCLOSURE, type ResolvedAffiliateProduct } from "@/lib/products/catalog";

function formatPrice(price: number | null) {
  if (price == null) {
    return null;
  }

  return new Intl.NumberFormat("ko-KR").format(price);
}

export function RelatedProductCard({
  products,
  heading = "관련 상품",
  hideHeading = false,
  hideDisclosure = false
}: {
  products: ResolvedAffiliateProduct[];
  heading?: string;
  hideHeading?: boolean;
  hideDisclosure?: boolean;
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div>
      {hideHeading ? null : <p className="text-sm font-semibold tracking-[0.16em] text-gray-400">{heading}</p>}
      <div className={`${hideHeading ? "" : "mt-4 "}overflow-hidden rounded-xl border border-navy-100 bg-white`}>
        {products.map((product) => {
          const formattedPrice = formatPrice(product.price);

          return (
            <Link
              key={product.id}
              href={product.linkUrl}
              target="_blank"
              rel="noreferrer sponsored"
              className="block px-4 py-4 transition hover:bg-orange-50/20 [&+a]:border-t [&+a]:border-navy-100"
            >
              <div className="flex items-start gap-3">
                {product.imageUrl ? (
                  <div className="w-14 shrink-0 self-start overflow-hidden rounded-md border border-navy-100 bg-white md:w-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.imageUrl} alt={product.title} className="aspect-square w-full object-cover" />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[0.82rem] font-medium leading-5 text-navy-900">
                    {product.title}
                  </p>
                  {formattedPrice ? (
                    <p className="mt-1.5 text-[1rem] font-bold leading-none tracking-[-0.02em] text-orange-600">
                      {formattedPrice}원
                    </p>
                  ) : null}
                </div>
              </div>

              {product.description ? (
                <div className="mt-3 rounded-lg bg-navy-50 px-4 py-3">
                  <p className="line-clamp-3 text-[0.84rem] leading-5 text-navy-700 md:text-[0.88rem] md:leading-6">
                    {product.description}
                  </p>
                </div>
              ) : null}
            </Link>
          );
        })}
        {hideDisclosure ? null : (
          <div className="border-t border-navy-100 px-4 py-3">
            <p className="text-[11px] leading-5 text-navy-400">{PRODUCT_DISCLOSURE}</p>
          </div>
        )}
      </div>
    </div>
  );
}
