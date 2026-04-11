import { type ResolvedAffiliateProduct } from "@/lib/products/catalog";

function formatPrice(price: number | null) {
  if (price == null) return null;
  return new Intl.NumberFormat("ko-KR").format(price);
}

export function FeedProductCard({ product }: { product: ResolvedAffiliateProduct }) {
  const price = formatPrice(product.price);

  return (
    <div className="rounded-xl bg-orange-50 p-4 my-1">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-orange-600">추천 상품</span>
      </div>
      <a href={product.linkUrl} target="_blank" rel="noopener sponsored" className="block transition hover:opacity-80">
        <div className="flex gap-3">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.title} className="w-20 h-20 rounded-lg object-cover shrink-0 bg-white" />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-white flex items-center justify-center text-xs text-gray-300 shrink-0">상품</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm line-clamp-2 text-navy-900">{product.title}</p>
            {price ? (
              <p className="font-bold text-base mt-1 text-orange-600">{price}원</p>
            ) : null}
          </div>
        </div>
      </a>
    </div>
  );
}
