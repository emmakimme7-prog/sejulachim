import { PRODUCT_DISCLOSURE, type ResolvedAffiliateProduct } from "@/lib/products/catalog";

function formatPrice(price: number | null) {
  if (price == null) return null;
  return new Intl.NumberFormat("ko-KR").format(price);
}

export function ProductGridCard({ products }: { products: ResolvedAffiliateProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-6 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-400 mb-3">이 기사와 관련된 상품</p>
      <div className="grid grid-cols-3 gap-3">
        {products.map((product) => {
          const price = formatPrice(product.price);
          return (
            <a
              key={product.id}
              href={product.linkUrl}
              target="_blank"
              rel="noopener sponsored"
              className="block transition hover:opacity-80"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                {product.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">상품 이미지</div>
                )}
              </div>
              <p className="text-xs font-medium line-clamp-2 leading-tight text-navy-900">{product.title}</p>
              {price ? (
                <p className="text-xs text-orange-600 font-bold mt-1">{price}원</p>
              ) : null}
            </a>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400 mt-3">{PRODUCT_DISCLOSURE}</p>
    </section>
  );
}
