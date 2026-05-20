/**
 * 쿠팡 상품 캐시 워밍업 (테이블 생성 후 최초 1회 실행)
 * node scripts/warm-product-cache.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filename) {
  const filePath = resolve(process.cwd(), filename);
  const raw = readFileSync(filePath, "utf8");
  const entries = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

const env = { ...loadEnvFile(".env.local"), ...process.env };
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const COUPANG_API_DOMAIN = "https://api-gateway.coupang.com";
const COUPANG_DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";
const COUPANG_PRODUCT_SEARCH_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEEPLINK_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// 코드와 동일한 키워드 목록
const ALL_KEYWORDS = [
  "혈압계", "관절 보호대", "건강식품", "건강 도서", "혈당측정기",
  "서류 정리함", "문서 스캐너", "문서 보관함", "보이스피싱 차단기",
  "문서 세단기", "생활용품", "소형 가전", "청소용품", "주방용품",
  "차량용품", "라디오", "전자계산기", "아코디언 파일", "안전 경보기",
  "여행 어댑터", "가족 보드게임", "커플 선물", "사무용품", "취미용품",
  "피크닉 용품",
  // sub_interest 원문 키워드 (매핑 없는 경우 그대로 검색)
  "혈압", "관절", "음식", "상식", "병원", "연금", "세금", "보험",
  "주의", "혜택", "꿀팁", "가전", "청소", "요리", "교통",
  "주요 뉴스", "경제", "정책", "사회", "해외", "가족", "부부",
  "회사", "취미", "친구",
  // 87bde63 신규 매핑 (친구→캠핑매트 등 매칭 오류 제거 + 관계/건강 신규 키워드).
  // 런타임에서 cache miss 시 자동 fetch+upsert(setProductCache)되지만, 신규
  // 방문자 첫 노출이 fallback("베스트셀러도서/텀블러")로 떨어지지 않게 사전 워밍.
  "친구 선물", "케이크 기프티콘", "다과 세트", "감성다이어리", "꽃다발",
  "선물세트", "기념일 선물", "와인", "선후배 선물세트",
  "마사지건", "체중계", "텀블러", "건강기능식품",
];

const STATIC_CATALOG_URLS = [
  "https://www.coupang.com/np/search?component=&q=%ED%98%88%EC%95%95%20%EC%B8%A1%EC%A0%95%20%EC%8A%A4%EB%A7%88%ED%8A%B8%EC%9B%8C%EC%B9%98",
  "https://www.coupang.com/np/search?component=&q=%EB%AC%B4%EB%A6%8E%20%EB%B3%B4%ED%98%B8%EB%8C%80%20%EC%9A%B4%EB%8F%99%EC%9A%A9",
  "https://www.coupang.com/np/search?component=&q=%EC%86%8C%EB%B6%84%20%EB%B0%80%ED%8F%90%20%EB%8F%84%EC%8B%9C%EB%9D%BD%ED%86%B5",
  "https://www.coupang.com/np/search?component=&q=%EC%8B%9C%EB%8B%88%EC%96%B4%20%EA%B1%B4%EA%B0%95%20%EC%83%81%EC%8B%9D%20%EC%B1%85",
  "https://www.coupang.com/np/search?component=&q=%EC%A3%BC%EA%B0%84%20%EC%95%BD%20%EB%B3%B4%EA%B4%80%ED%95%A8",
  "https://www.coupang.com/np/search?component=&q=%EC%84%9C%EB%A5%98%20%EC%A0%95%EB%A6%AC%20%ED%8C%8C%EC%9D%BC%20%EC%95%84%EC%BD%94%EB%94%94%EC%96%B8",
  "https://www.coupang.com/np/search?component=&q=%ED%9C%B4%EB%8C%80%EC%9A%A9%20%EB%AC%B8%EC%84%9C%20%EC%8A%A4%EC%BA%90%EB%84%88",
  "https://www.coupang.com/np/search?component=&q=%EB%AC%B8%EC%84%9C%20%EB%B3%B4%EA%B4%80%ED%95%A8%20%EB%B0%A9%EC%88%98",
  "https://www.coupang.com/np/search?component=&q=%EB%B3%B4%EC%9D%B4%EC%8A%A4%ED%94%BC%EC%8B%B1%20%EC%B0%A8%EB%8B%A8%20%EC%A0%84%ED%99%94%EA%B8%B0",
  "https://www.coupang.com/np/search?component=&q=%EB%AC%B8%EC%84%9C%20%EC%84%B8%EB%8B%A8%EA%B8%B0%20%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4",
  "https://www.coupang.com/np/search?component=&q=%EC%9D%B4%EB%8F%99%EC%8B%9D%20%ED%8B%88%EC%83%88%20%EC%88%98%EB%82%A9%EC%9E%A5",
  "https://www.coupang.com/np/search?component=&q=%EC%97%90%EC%96%B4%ED%94%84%EB%9D%BC%EC%9D%B4%EC%96%B4%20%EC%A2%85%EC%9D%B4%ED%98%B8%EC%9D%BC",
  "https://www.coupang.com/np/search?component=&q=%EB%8C%80%EC%9A%A9%EB%9F%89%20%EC%B2%AD%EC%86%8C%ED%8F%AC",
  "https://www.coupang.com/np/search?component=&q=%EB%85%BC%EC%8A%A4%ED%8B%B1%20%ED%94%84%EB%9D%BC%EC%9D%B4%ED%8C%AC%20%EC%84%B8%ED%8A%B8",
  "https://www.coupang.com/np/search?component=&q=%EC%B0%A8%EB%9F%89%EC%9A%A9%20%ED%97%88%EB%A6%AC%20%EC%BF%A0%EC%85%98",
  "https://www.coupang.com/np/search?component=&q=%ED%9C%B4%EB%8C%80%EC%9A%A9%20%EB%9D%BC%EB%94%94%EC%98%A4",
  "https://www.coupang.com/np/search?component=&q=%ED%9C%B4%EB%8C%80%EC%9A%A9%20%EC%A0%84%EC%9E%90%20%EA%B3%84%EC%82%B0%EA%B8%B0",
  "https://www.coupang.com/np/search?component=&q=%EC%95%84%EC%BD%94%EB%94%94%EC%96%B8%20%ED%8C%8C%EC%9D%BC%20%EC%84%9C%EB%A5%98%EC%A0%95%EB%A6%AC",
  "https://www.coupang.com/np/search?component=&q=%ED%9C%B4%EB%8C%80%EC%9A%A9%20%EC%95%88%EC%A0%84%20%EA%B2%BD%EB%B3%B4%EA%B8%B0",
  "https://www.coupang.com/np/search?component=&q=%ED%95%B4%EC%99%B8%20%EB%A9%80%ED%8B%B0%20%EC%96%B4%EB%8C%91%ED%84%B0",
  "https://www.coupang.com/np/search?component=&q=%EA%B0%80%EC%A1%B1%20%EC%9D%BC%EC%A0%95%20%EB%B3%B4%EB%93%9C",
  "https://www.coupang.com/np/search?component=&q=%EB%B6%80%EB%B6%80%20%EB%8C%80%ED%99%94%20%EC%A7%88%EB%AC%B8%20%EC%B9%B4%EB%93%9C",
  "https://www.coupang.com/np/search?component=&q=%EB%8D%B0%EC%8A%A4%ED%81%AC%20%EB%A9%94%EB%AA%A8%20%ED%8C%A8%EB%93%9C",
  "https://www.coupang.com/np/search?component=&q=%EC%BB%AC%EB%9F%AC%EB%A7%81%EB%B6%81%20%EC%84%B8%ED%8A%B8%20%EC%84%B1%EC%9D%B8",
  "https://www.coupang.com/np/search?component=&q=2%EC%9D%B8%EC%9A%A9%20%ED%94%BC%ED%81%AC%EB%8B%89%20%EB%A7%A4%ED%8A%B8",
];

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

function createAuthorizationHeader(method, path) {
  const accessKey = env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
  const secretKey = env.COUPANG_PARTNERS_SECRET_KEY?.trim();
  const [pathname, query = ""] = path.split("?");
  const signedDate = getSignedDate();
  const message = `${signedDate}${method}${pathname}${query}`;
  const signature = createHmac("sha256", secretKey).update(message, "utf8").digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

async function fetchAndCache(keyword) {
  const query = `keyword=${encodeURIComponent(keyword)}&limit=6&imageSize=512x512&srpLinkOnly=false`;
  const pathWithQuery = `${COUPANG_PRODUCT_SEARCH_PATH}?${query}`;
  const authorization = createAuthorizationHeader("GET", pathWithQuery);

  const response = await fetch(`${COUPANG_API_DOMAIN}${pathWithQuery}`, {
    method: "GET",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${body.slice(0, 200)}`);
  }

  const payload = await response.json();
  if (payload.rCode && payload.rCode !== "0") {
    throw new Error(`rCode ${payload.rCode}: ${payload.rMessage ?? ""}`);
  }

  const products = payload.data?.productData ?? [];
  const now = new Date();
  await supabase.from('sj_coupang_product_cache').upsert({
    keyword,
    products,
    cached_at: now.toISOString(),
    expires_at: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
  });

  return products;
}

async function cacheDeepLinks(urls) {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  if (uniqueUrls.length === 0) return 0;

  const path = COUPANG_DEEPLINK_PATH;
  const authorization = createAuthorizationHeader("POST", path);
  const response = await fetch(`${COUPANG_API_DOMAIN}${path}`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify({ coupangUrls: uniqueUrls }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${body.slice(0, 200)}`);
  }

  const payload = await response.json();
  if (payload.rCode && payload.rCode !== "0") {
    throw new Error(`rCode ${payload.rCode}: ${payload.rMessage ?? ""}`);
  }

  const rows = (payload.data ?? [])
    .filter((item) => item.originalUrl && item.shortenUrl)
    .map((item) => ({
      original_url: item.originalUrl,
      shorten_url: item.shortenUrl,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + DEEPLINK_CACHE_TTL_MS).toISOString(),
    }));

  if (rows.length > 0) {
    await supabase.from("coupang_deeplink_cache").upsert(rows, { onConflict: "original_url" });
  }

  return rows.length;
}

async function main() {
  const accessKey = env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
  const secretKey = env.COUPANG_PARTNERS_SECRET_KEY?.trim();
  if (!accessKey || !secretKey) throw new Error("COUPANG 키 없음");

  // 이미 fresh 한(만료까지 1일 이상 남은) 키워드는 건너뛰어 쿠팡 API 호출/차단 위험 최소화.
  // 강제로 전체 재워밍하려면 환경변수 FORCE_REWARM=1 로 실행.
  const force = String(env.FORCE_REWARM || "").trim() === "1";
  let keywordsToProcess = [...ALL_KEYWORDS];
  if (!force) {
    const { data: cached } = await supabase
      .from("sj_coupang_product_cache")
      .select("keyword, expires_at")
      .in("keyword", ALL_KEYWORDS);
    const cutoff = Date.now() + 24 * 60 * 60 * 1000;
    const fresh = new Set(
      (cached ?? [])
        .filter((r) => r.expires_at && new Date(r.expires_at).getTime() > cutoff)
        .map((r) => r.keyword)
    );
    keywordsToProcess = ALL_KEYWORDS.filter((k) => !fresh.has(k));
    console.log(
      `총 ${ALL_KEYWORDS.length}개 중 fresh ${fresh.size}개 skip → ${keywordsToProcess.length}개 fetch 필요 ` +
      `(FORCE_REWARM=1 로 강제 재워밍 가능)`
    );
  } else {
    console.log(`FORCE_REWARM=1 → 전체 ${ALL_KEYWORDS.length}개 재워밍`);
  }

  console.log(`\n총 ${keywordsToProcess.length}개 키워드 캐싱 시작\n`);

  let ok = 0, fail = 0, deeplinkOk = 0, deeplinkFail = 0;
  for (const keyword of keywordsToProcess) {
    try {
      const products = await fetchAndCache(keyword);
      const urls = products
        .map((item) => item.productUrl)
        .filter(Boolean)
        .slice(0, 6);
      const deeplinkCount = await cacheDeepLinks(urls);
      console.log(`[ok] "${keyword}" — ${products.length}개 상품, 딥링크 ${deeplinkCount}개`);
      ok++;
      deeplinkOk++;
    } catch (e) {
      console.error(`[fail] "${keyword}" — ${e.message}`);
      fail++;
      deeplinkFail++;
    }
    // API 제한 대응: 요청 간 1.5초 간격
    await new Promise((r) => setTimeout(r, 1500));
  }

  try {
    const staticCount = await cacheDeepLinks(STATIC_CATALOG_URLS);
    console.log(`[ok] 정적 카탈로그 딥링크 — ${staticCount}개`);
  } catch (e) {
    console.error(`[fail] 정적 카탈로그 딥링크 — ${e.message}`);
  }

  console.log(`\n완료: 검색 ${ok}개 성공, ${fail}개 실패 / 딥링크 ${deeplinkOk}개 성공, ${deeplinkFail}개 실패`);
}

main().catch((e) => { console.error(e); process.exit(1); });
