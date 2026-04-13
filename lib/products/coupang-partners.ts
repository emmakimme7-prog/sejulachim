import "server-only";

import { createHmac } from "node:crypto";
import { getOptionalServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { type ProductCatalogItem, type ResolvedAffiliateProduct } from "@/lib/products/catalog";

const COUPANG_API_DOMAIN = "https://api-gateway.coupang.com";
const COUPANG_DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";
const COUPANG_PRODUCT_SEARCH_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";

// 캐시 TTL: 7일 신선, 14일 stale-if-error (API 호출 최소화)
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_STALE_MAX_MS = 14 * 24 * 60 * 60 * 1000;

type DeepLinkResponse = {
  rCode?: string;
  rMessage?: string;
  data?: Array<{
    originalUrl?: string;
    shortenUrl?: string;
  }>;
};

type DeepLinkEntry = {
  originalUrl: string;
  shortenUrl: string;
};

type ProductSearchResponse = {
  rCode?: string;
  rMessage?: string;
  data?: {
    landingUrl?: string;
    productData?: Array<{
      rank?: number;
      productId?: number;
      productImage?: string;
      productName?: string;
      productPrice?: number;
      productUrl?: string;
      keyword?: string;
    }>;
  };
};

type SearchProductEntry = NonNullable<NonNullable<ProductSearchResponse["data"]>["productData"]>[number];

// ─── DB 캐시 ─────────────────────────────────────────────
type CacheRow = {
  products: SearchProductEntry[];
  cached_at: string;
  expires_at: string;
};

async function getProductCache(keyword: string): Promise<CacheRow | null> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("coupang_product_cache")
      .select("products, cached_at, expires_at")
      .eq("keyword", keyword)
      .single();
    return (data as CacheRow) ?? null;
  } catch {
    return null;
  }
}

async function setProductCache(keyword: string, products: SearchProductEntry[]): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();
    const now = new Date();
    await supabase.from("coupang_product_cache").upsert({
      keyword,
      products,
      cached_at: now.toISOString(),
      expires_at: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
    });
  } catch {
    // 캐시 저장 실패는 무시 (API 결과는 이미 반환)
  }
}

// ─── Coupang API ──────────────────────────────────────────
function getSignedDate() {
  const now = new Date();
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const date = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${date}T${hours}${minutes}${seconds}Z`;
}

function createAuthorizationHeader(method: string, path: string, accessKey: string, secretKey: string) {
  const [pathname, query = ""] = path.split("?");
  const signedDate = getSignedDate();
  const message = `${signedDate}${method}${pathname}${query}`;
  const signature = createHmac("sha256", secretKey).update(message, "utf8").digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

async function requestAffiliateDeepLinks(urls: string[]) {
  const env = getOptionalServerEnv();
  const accessKey = env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
  const secretKey = env.COUPANG_PARTNERS_SECRET_KEY?.trim();

  if (!accessKey || !secretKey || urls.length === 0) {
    return [];
  }

  const authorization = createAuthorizationHeader("POST", COUPANG_DEEPLINK_PATH, accessKey, secretKey);
  const response = await fetch(`${COUPANG_API_DOMAIN}${COUPANG_DEEPLINK_PATH}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ coupangUrls: urls }),
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Coupang deeplink request failed: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as DeepLinkResponse;
  if (payload.rCode && payload.rCode !== "0") {
    throw new Error(`Coupang deeplink response error: ${payload.rCode} ${payload.rMessage ?? ""}`.trim());
  }

  return (payload.data ?? []).filter(
    (item): item is DeepLinkEntry => Boolean(item.originalUrl && item.shortenUrl)
  );
}

export async function attachAffiliateLinks(products: ProductCatalogItem[]): Promise<ProductCatalogItem[]> {
  if (products.length === 0) {
    return products;
  }

  const urls = Array.from(new Set(products.map((item) => item.linkUrl)));

  try {
    const deepLinks = await requestAffiliateDeepLinks(urls);
    const deepLinkMap = new Map(deepLinks.map((item) => [item.originalUrl, item.shortenUrl]));
    return products.map((item) => ({
      ...item,
      linkUrl: deepLinkMap.get(item.linkUrl) ?? item.linkUrl
    }));
  } catch (error) {
    console.error("[coupang-partners] falling back to original urls", error);
    return products;
  }
}

function tokenizeKeyword(keyword: string) {
  return keyword
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= 2);
}

function scoreSearchResult(item: SearchProductEntry, keyword: string) {
  const name = item.productName?.trim().toLowerCase() ?? "";
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!name || !normalizedKeyword) {
    return -1;
  }

  const apiKeyword = item.keyword?.trim().toLowerCase() ?? "";
  if (apiKeyword === "gold box" || apiKeyword === "goldbox") {
    return -1;
  }

  const tokens = tokenizeKeyword(keyword);
  const exactPhraseBonus = name.includes(normalizedKeyword) ? 10 : 0;
  const tokenMatches = tokens.reduce((count, token) => (name.includes(token) ? count + 1 : count), 0);
  const strongMatchBonus = tokenMatches >= Math.max(1, Math.ceil(tokens.length / 2)) ? 4 : 0;

  return exactPhraseBonus + tokenMatches * 3 + strongMatchBonus;
}

/**
 * 핵심 함수: DB 캐시 우선 조회, 미스/만료 시 API 호출
 * API 실패해도 stale 캐시 반환 → 절대 빈 결과 없음
 */
async function requestTopSearchProducts(keyword: string, limit = 1, minScore = 1): Promise<SearchProductEntry[]> {
  const env = getOptionalServerEnv();
  const accessKey = env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
  const secretKey = env.COUPANG_PARTNERS_SECRET_KEY?.trim();

  if (!accessKey || !secretKey || !keyword.trim()) {
    return [];
  }

  // 1. DB 캐시 조회 (캐시는 score 필터 없이 저장, 반환 시 필터 적용)
  const cached = await getProductCache(keyword);
  const now = Date.now();

  if (cached) {
    const expiresAt = new Date(cached.expires_at).getTime();
    const cachedAt = new Date(cached.cached_at).getTime();
    const isFresh = now < expiresAt;
    const isWithinStaleWindow = now - cachedAt < CACHE_STALE_MAX_MS;

    if (isFresh) {
      const cachedProducts = (cached.products as SearchProductEntry[]) ?? [];
      const filtered = cachedProducts.filter((p) => scoreSearchResult(p, keyword) >= minScore);
      // 필터 후 충분한 수가 있으면 즉시 반환, 부족하면 API 재호출
      if (filtered.length >= limit) {
        return filtered;
      }
    }

    if (isWithinStaleWindow) {
      // 만료됐지만 stale 윈도우 내 → API 시도, 실패하면 stale 반환
      try {
        // score 필터 없이 API 저장 (minScore=0), 반환 시 필터
        const fresh = await callCoupangSearchAPI(keyword, limit * 3, accessKey, secretKey, 0);
        await setProductCache(keyword, fresh);
        return fresh.filter((p) => scoreSearchResult(p, keyword) >= minScore);
      } catch {
        console.warn(`[coupang-cache] API 실패, stale 캐시 반환: ${keyword}`);
        const stale = (cached.products as SearchProductEntry[]) ?? [];
        return stale.filter((p) => scoreSearchResult(p, keyword) >= minScore);
      }
    }
  }

  // 2. 캐시 없거나 완전히 만료 → API 호출 (score 필터 없이 저장)
  try {
    const fresh = await callCoupangSearchAPI(keyword, limit * 3, accessKey, secretKey, 0);
    await setProductCache(keyword, fresh);
    return fresh.filter((p) => scoreSearchResult(p, keyword) >= minScore);
  } catch (error) {
    console.error(`[coupang-cache] API 실패, 캐시 없음: ${keyword}`, error);
    return [];
  }
}

async function callCoupangSearchAPI(
  keyword: string,
  limit: number,
  accessKey: string,
  secretKey: string,
  minScore = 1
): Promise<SearchProductEntry[]> {
  const clampedLimit = Math.max(1, Math.min(limit, 5));
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${clampedLimit}&imageSize=512x512&srpLinkOnly=false`;
  const pathWithQuery = `${COUPANG_PRODUCT_SEARCH_PATH}?${query}`;
  const authorization = createAuthorizationHeader("GET", pathWithQuery, accessKey, secretKey);

  const response = await fetch(`${COUPANG_API_DOMAIN}${pathWithQuery}`, {
    method: "GET",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Coupang product search failed: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as ProductSearchResponse;
  if (payload.rCode && payload.rCode !== "0") {
    throw new Error(`Coupang product search response error: ${payload.rCode} ${payload.rMessage ?? ""}`.trim());
  }

  const rows = payload.data?.productData ?? [];
  return [...rows]
    .map((item) => ({ item, score: scoreSearchResult(item, keyword) }))
    .filter((entry) => entry.score >= minScore)
    .sort((left, right) => {
      // 1만~10만원 범위 상품 우선 (소프트 필터)
      const priceA = left.item.productPrice;
      const priceB = right.item.productPrice;
      const inRangeA = typeof priceA === "number" && priceA >= 10000 && priceA <= 100000 ? 1 : 0;
      const inRangeB = typeof priceB === "number" && priceB >= 10000 && priceB <= 100000 ? 1 : 0;
      if (inRangeB !== inRangeA) return inRangeB - inRangeA;
      // 로켓배송 우선
      const rocketA = (left.item as Record<string, unknown>).isRocket ? 1 : 0;
      const rocketB = (right.item as Record<string, unknown>).isRocket ? 1 : 0;
      if (rocketB !== rocketA) return rocketB - rocketA;
      return right.score - left.score || (left.item.rank ?? 9999) - (right.item.rank ?? 9999);
    })
    .map((entry) => entry.item);
}

export async function resolveRepresentativeProduct(product: ProductCatalogItem): Promise<ResolvedAffiliateProduct | null> {
  try {
    const candidateKeywords = [product.searchKeyword, ...(product.searchKeywords ?? [])];
    let found: SearchProductEntry | null = null;
    let matchedKeyword = product.searchKeyword;

    for (const keyword of candidateKeywords) {
      const candidate = (await requestTopSearchProducts(keyword))[0] ?? null;
      if (candidate) {
        found = candidate;
        matchedKeyword = keyword;
        break;
      }
    }

    if (!found) {
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: null,
        imageUrl: null,
        linkUrl: product.linkUrl,
        sourceKeyword: product.searchKeyword
      };
    }

    return {
      id: `${product.id}-${found.productId ?? "top"}`,
      title: found.productName?.trim() || product.title,
      description: product.description,
      price: typeof found.productPrice === "number" ? found.productPrice : null,
      imageUrl: found.productImage?.trim() || null,
      linkUrl: found.productUrl?.trim() || product.linkUrl,
      sourceKeyword: matchedKeyword
    };
  } catch (error) {
    console.error("[coupang-partners] representative product fallback", error);
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: null,
      imageUrl: null,
      linkUrl: product.linkUrl,
      sourceKeyword: product.searchKeyword
    };
  }
}

// 카테고리/서브카테고리 → 쿠팡 인기 상품 직접 조회
const CATEGORY_KEYWORD_MAP: Record<string, string[]> = {
  // 메인 카테고리 폴백
  실생활: ["무선청소기", "에어프라이어", "정리수납함", "생활용품"],
  건강: ["종합영양제", "마사지건", "체중계", "요가매트"],
  돈: ["재테크도서", "가계부", "다이어리"],
  뉴스: ["베스트셀러도서", "무선이어폰", "텀블러"],
  관계: ["베스트셀러도서", "감성다이어리", "보드게임"],
  // 서브 카테고리
  혈압: ["혈압계"],
  관절: ["관절 보호대"],
  음식: ["건강식품"],
  상식: ["건강 도서"],
  병원: ["혈당측정기"],
  연금: ["서류 정리함"],
  세금: ["문서 스캐너"],
  보험: ["문서 보관함"],
  주의: ["금융도서", "보안카드케이스"],
  혜택: ["가계부", "재테크도서"],
  꿀팁: ["구연산", "베이킹소다", "정리수납함", "다용도세제"],
  가전: ["공기청정기", "무선청소기", "에어프라이어", "가습기"],
  청소: ["로봇청소기", "물걸레청소기", "청소세제", "스팀청소기"],
  요리: ["밀키트 베스트", "프라이팬세트", "에어프라이어", "전기그릴"],
  교통: ["차량용충전기", "보조배터리", "우산", "교통카드케이스"],
  IT: ["무선이어폰", "충전케이블", "스마트폰케이스", "보호필름"],
  "주요 뉴스": ["베스트셀러도서", "무선이어폰"],
  경제: ["재테크도서", "경제신문"],
  정책: ["시사도서", "다이어리"],
  사회: ["시사도서", "베스트셀러도서"],
  해외: ["여행 어댑터"],
  가족: ["가족선물세트", "가족앨범", "가족 보드게임"],
  부부: ["커플 선물"],
  회사: ["사무용품"],
  취미: ["취미용품"],
  친구: ["피크닉 용품"],
};

export async function fetchPopularProductsForContent(
  category: string,
  subInterest?: string | null,
  limit = 3,
  contentTitle?: string | null
): Promise<ResolvedAffiliateProduct[]> {
  // 1순위: 기사 제목에서 명사 키워드 추출 (3~6글자 한글 단어만 — 2글자는 너무 일반적)
  const titleKeywords: string[] = [];
  if (contentTitle?.trim()) {
    const nouns = contentTitle.match(/[가-힣]{3,6}/g) ?? [];
    const stopWords = new Set([
      "이것", "그것", "저것", "하는", "있는", "없는", "되는", "이번", "오늘", "내일", "어제",
      "우리", "이런", "그런", "저런", "아직", "정도", "이상", "이하", "매우", "가장", "모든",
      "때문", "위해", "대한", "통해", "따른", "관련", "대해", "까지", "부터", "에서",
      "대폭", "인상", "추진", "배경", "돌파", "발표", "시작", "예정", "확인", "변경",
      "개선", "강화", "논란", "문제", "현황", "전망", "분석", "지속", "가능", "필요",
      "월부터", "올해", "내년", "최근", "시대", "방법", "주요", "핵심", "달라진",
      "활용법", "가지", "알아보", "꿀팁", "정리", "소개", "비교", "추천", "리뷰",
    ]);
    for (const w of nouns) {
      if (!stopWords.has(w) && !titleKeywords.includes(w)) titleKeywords.push(w);
    }
  }

  const sub = subInterest?.trim() ?? "";
  const subKeywords = sub && CATEGORY_KEYWORD_MAP[sub] ? CATEGORY_KEYWORD_MAP[sub] : [];
  const catKeywords = CATEGORY_KEYWORD_MAP[category] ?? [category];
  // 뉴스/정치 카테고리는 제목 키워드가 상품 매칭에 부적합하므로 폴백만 사용
  const skipTitleCategories = new Set(["뉴스"]);
  const useTitleKeywords = !skipTitleCategories.has(category);
  // 제목 키워드는 관련성 필터 적용 (minScore=3), 카테고리 키워드는 신뢰 (minScore=0)
  const titleKws = useTitleKeywords ? titleKeywords.slice(0, 3) : [];
  const fallbackKws = [...subKeywords, ...catKeywords].filter((k): k is string => Boolean(k?.trim()));

  const results: ResolvedAffiliateProduct[] = [];
  const seenIds = new Set<number>();

  function addItems(items: SearchProductEntry[], keyword: string) {
    for (const item of items) {
      if (results.length >= limit) break;
      if (item.productId && seenIds.has(item.productId)) continue;
      if (item.productId) seenIds.add(item.productId);
      if (!item.productUrl?.trim()) continue;
      results.push({
        id: `popular-${item.productId ?? results.length}`,
        title: item.productName?.trim() || keyword,
        description: "",
        price: typeof item.productPrice === "number" ? item.productPrice : null,
        imageUrl: item.productImage?.trim() || null,
        linkUrl: item.productUrl.trim(),
        sourceKeyword: keyword
      });
    }
  }

  // 1단계: 제목 키워드 — 상품명에 키워드가 포함된 것만 (minScore=3)
  for (const keyword of titleKws) {
    if (results.length >= limit) break;
    try {
      const items = await requestTopSearchProducts(keyword, limit * 3, 3);
      addItems(items, keyword);
    } catch {
      // 실패 시 다음 키워드 시도
    }
  }

  // 2단계: 카테고리/서브 키워드 — 큐레이션 키워드이므로 관련성 필터 완화 (minScore=0)
  for (const keyword of fallbackKws) {
    if (results.length >= limit) break;
    try {
      const items = await requestTopSearchProducts(keyword, limit * 3, 0);
      addItems(items, keyword);
    } catch {
      // 실패 시 다음 키워드 시도
    }
  }

  const finalResults = results.slice(0, limit);

  // 파트너스 딥링크 변환 (수수료 추적용)
  if (finalResults.length > 0) {
    try {
      const urls = finalResults.map((p) => p.linkUrl);
      const deepLinks = await requestAffiliateDeepLinks(urls);
      const linkMap = new Map(deepLinks.map((d) => [d.originalUrl, d.shortenUrl]));
      for (const product of finalResults) {
        product.linkUrl = linkMap.get(product.linkUrl) ?? product.linkUrl;
      }
    } catch {
      // 딥링크 변환 실패 시 원본 URL 유지
    }
  }

  return finalResults;
}

export async function resolveRepresentativeProducts(products: ProductCatalogItem[]): Promise<ResolvedAffiliateProduct[]> {
  const resolved = await Promise.all(products.map((product) => resolveRepresentativeProduct(product)));
  const seen = new Set<string>();

  return resolved.filter((item): item is ResolvedAffiliateProduct => {
    if (!item) {
      return false;
    }

    const hasRenderableLink = Boolean(item.linkUrl?.trim());
    if (!hasRenderableLink) {
      return false;
    }

    const dedupeKey = `${item.linkUrl.trim()}::${item.title.trim()}`;
    if (!dedupeKey || seen.has(dedupeKey)) {
      return false;
    }
    seen.add(dedupeKey);
    return true;
  });
}
