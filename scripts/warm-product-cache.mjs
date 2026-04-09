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
const COUPANG_PRODUCT_SEARCH_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

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
  await supabase.from("coupang_product_cache").upsert({
    keyword,
    products,
    cached_at: now.toISOString(),
    expires_at: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
  });

  return products.length;
}

async function main() {
  const accessKey = env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
  const secretKey = env.COUPANG_PARTNERS_SECRET_KEY?.trim();
  if (!accessKey || !secretKey) throw new Error("COUPANG 키 없음");

  console.log(`\n총 ${ALL_KEYWORDS.length}개 키워드 캐싱 시작\n`);

  let ok = 0, fail = 0;
  for (const keyword of ALL_KEYWORDS) {
    try {
      const count = await fetchAndCache(keyword);
      console.log(`[ok] "${keyword}" — ${count}개 상품`);
      ok++;
    } catch (e) {
      console.error(`[fail] "${keyword}" — ${e.message}`);
      fail++;
    }
    // API 제한 대응: 요청 간 1.5초 간격
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n완료: ${ok}개 성공, ${fail}개 실패`);
}

main().catch((e) => { console.error(e); process.exit(1); });
