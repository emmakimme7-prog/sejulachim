import "server-only";

import { generateAndStoreContentAudio } from "@/lib/content/audio";
import { summarizeContentItem } from "@/lib/content/summarize";
import { MAIN_INTERESTS, SUB_INTERESTS, getStoredCategoryForMainInterest } from "@/lib/content/sub-interests";
import type { SourceType } from "@/lib/content/sources";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getKstDateParts, sanitizePlainText } from "@/lib/utils";

type SummaryType = "MUST" | "USEFUL" | "ACTION";

type SourceQuery = {
  query: string;
  type: SourceType;
};

type FeedItem = {
  title: string;
  link: string;
  description: string;
  sourceName: string;
  publishedAt: string | null;
  type: SourceType;
};

const CATEGORY_SLUG_MAP: Record<string, string> = {
  건강: "health",
  돈: "money",
  실생활: "daily",
  뉴스: "news",
  관계: "relation"
};

const SUB_INTEREST_SLUG_MAP: Record<string, string> = {
  혈압: "blood-pressure",
  관절: "joint",
  음식: "food",
  상식: "common-sense",
  병원: "hospital",
  연금: "pension",
  세금: "tax",
  보험: "insurance",
  주의: "warning",
  혜택: "benefit",
  꿀팁: "tips",
  가전: "appliance",
  청소: "cleaning",
  요리: "cooking",
  교통: "traffic",
  "주요 뉴스": "top-news",
  경제: "economy",
  정책: "policy",
  사회: "society",
  해외: "global",
  가족: "family",
  부부: "couple",
  회사: "office",
  취미: "hobby",
  친구: "friend"
};

const SUMMARY_TYPE_ORDER: SummaryType[] = ["MUST", "USEFUL", "ACTION"];

const SUB_INTEREST_SOURCE_QUERIES: Record<string, SourceQuery[]> = {
  혈압: [
    { query: "혈압 관리", type: "news" },
    { query: "고혈압", type: "news" },
    { query: "혈압 측정", type: "news" }
  ],
  관절: [
    { query: "관절 통증", type: "news" },
    { query: "무릎 건강", type: "news" },
    { query: "관절염", type: "news" }
  ],
  음식: [
    { query: "건강 음식", type: "news" },
    { query: "식단 관리", type: "news" },
    { query: "음식 건강", type: "news" }
  ],
  상식: [
    { query: "건강 상식", type: "news" },
    { query: "생활 건강", type: "news" },
    { query: "의학 상식", type: "news" }
  ],
  병원: [
    { query: "병원 이용 site:gov.kr", type: "public" },
    { query: "진료 안내 site:gov.kr", type: "public" },
    { query: "병원 진료", type: "news" }
  ],
  연금: [
    { query: "국민연금 site:nps.or.kr", type: "public" },
    { query: "연금 수령 site:gov.kr", type: "public" },
    { query: "연금 수령", type: "news" }
  ],
  세금: [
    { query: "세금 신고 site:nts.go.kr", type: "public" },
    { query: "홈택스 site:hometax.go.kr", type: "public" },
    { query: "세금 신고", type: "news" }
  ],
  보험: [
    { query: "보험 site:fss.or.kr", type: "public" },
    { query: "건강보험 site:nhis.or.kr", type: "public" },
    { query: "보험 보장", type: "news" }
  ],
  주의: [
    { query: "금융사기 주의 site:fss.or.kr", type: "public" },
    { query: "소비자 주의 site:gov.kr", type: "public" },
    { query: "금융 주의", type: "news" }
  ],
  혜택: [
    { query: "지원 혜택 site:gov.kr", type: "public" },
    { query: "복지 혜택 site:gov.kr", type: "public" },
    { query: "지원 혜택", type: "news" }
  ],
  꿀팁: [
    { query: "생활 꿀팁", type: "news" },
    { query: "생활 정보", type: "news" },
    { query: "정리 팁", type: "news" }
  ],
  가전: [
    { query: "가전 관리", type: "news" },
    { query: "가전 청소", type: "news" },
    { query: "전자제품 관리", type: "news" }
  ],
  청소: [
    { query: "청소 팁", type: "news" },
    { query: "집 청소", type: "news" },
    { query: "정리정돈", type: "news" }
  ],
  요리: [
    { query: "간단 요리", type: "news" },
    { query: "집밥 레시피", type: "news" },
    { query: "요리 팁", type: "news" }
  ],
  교통: [
    { query: "교통 정보", type: "news" },
    { query: "대중교통", type: "news" },
    { query: "교통 정책", type: "news" }
  ],
  "주요 뉴스": [
    { query: "주요 뉴스", type: "news" },
    { query: "오늘 뉴스", type: "news" },
    { query: "속보", type: "news" }
  ],
  경제: [
    { query: "경제 뉴스", type: "news" },
    { query: "환율 물가", type: "news" },
    { query: "금리 경제", type: "news" }
  ],
  정책: [
    { query: "정책 발표 site:gov.kr", type: "public" },
    { query: "제도 변경 site:gov.kr", type: "public" },
    { query: "정책 변화", type: "news" }
  ],
  사회: [
    { query: "사회 뉴스", type: "news" },
    { query: "생활 사회", type: "news" },
    { query: "안전 교육", type: "news" }
  ],
  해외: [
    { query: "해외 뉴스", type: "news" },
    { query: "국제 뉴스", type: "news" },
    { query: "글로벌 경제", type: "news" }
  ],
  가족: [
    { query: "가족 관계", type: "news" },
    { query: "돌봄 가족", type: "news" },
    { query: "양육 가족", type: "news" }
  ],
  부부: [
    { query: "부부 관계", type: "news" },
    { query: "가사 분담", type: "news" },
    { query: "부부 대화", type: "news" }
  ],
  회사: [
    { query: "직장 소통", type: "news" },
    { query: "회사 관계", type: "news" },
    { query: "직장인 업무", type: "news" }
  ],
  취미: [
    { query: "취미 생활", type: "news" },
    { query: "문화 생활", type: "news" },
    { query: "여가 활동", type: "news" }
  ],
  친구: [
    { query: "친구 관계", type: "news" },
    { query: "대인관계", type: "news" },
    { query: "인간관계", type: "news" }
  ]
};

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function buildPublishedAtFallback(date: string, offsetMinutes: number) {
  const base = new Date(`${date}T07:00:00+09:00`);
  base.setMinutes(base.getMinutes() + offsetMinutes);
  return base.toISOString();
}

function extractTagValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'");
}

function stripHtml(value: string) {
  return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatKstDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
  return formatted;
}

function parseGoogleNewsRss(xml: string, type: SourceType): FeedItem[] {
  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);

  return itemBlocks
    .map((block) => {
      const title = stripHtml(extractTagValue(block, "title")).replace(/\s+-\s+[^-]+$/, "").trim();
      const link = decodeHtml(extractTagValue(block, "link"));
      const description = stripHtml(extractTagValue(block, "description"));
      const pubDate = extractTagValue(block, "pubDate");
      const sourceName = stripHtml(extractTagValue(block, "source")) || "출처 미상";

      if (!title || !link) {
        return null;
      }

      return {
        title,
        link,
        description,
        sourceName,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
        type
      } satisfies FeedItem;
    })
    .filter((item): item is FeedItem => Boolean(item));
}

async function fetchGoogleNewsItems(query: string, date: string, type: SourceType): Promise<{ items: FeedItem[]; allItems: FeedItem[] }> {
  const prevDate2 = addDays(date, -2);
  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, 1);
  const nextDate2 = addDays(date, 2);
  // 날짜 연산자를 검색에서 제거 (Google News RSS에서 신뢰도 낮음).
  // 대신 최근 ±2일 내 기사만 허용하는 pubDate 필터로 대체.
  // 날짜 필터 0건 시 allItems(날짜 무관)로 폴백 가능하도록 함께 반환.
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; SejulachimBot/1.0; +https://sejulachim.studiobyyou.kr)"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`RSS_FETCH_FAILED:${response.status}`);
  }

  const xml = await response.text();
  const allItems = parseGoogleNewsRss(xml, type);
  const allowedDates = new Set([prevDate2, prevDate, date, nextDate, nextDate2]);
  const items = allItems.filter(
    (item) => !item.publishedAt || allowedDates.has(formatKstDate(item.publishedAt))
  );
  return { items, allItems };
}

async function collectSourceItemsForSubInterest(subInterest: string, date: string) {
  const queries = SUB_INTEREST_SOURCE_QUERIES[subInterest] ?? [{ query: subInterest, type: "news" as const }];
  const seen = new Set<string>();
  const collected: FeedItem[] = [];
  // 날짜 필터 0건 시 폴백으로 쓸 날짜 무관 아이템 목록
  const fallbackPool: FeedItem[] = [];

  const settled = await Promise.allSettled(
    queries.map((entry) => fetchGoogleNewsItems(entry.query, date, entry.type))
  );

  for (const result of settled) {
    if (result.status !== "fulfilled") {
      continue;
    }

    // 날짜 필터 통과 아이템 우선 수집
    for (const item of result.value.items) {
      const key = `${item.title}|${item.link}`;
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(item);
      if (collected.length >= 3) return collected;
    }

    // 폴백 풀에 날짜 무관 아이템 적재 (중복 제외)
    for (const item of result.value.allItems) {
      const key = `${item.title}|${item.link}`;
      if (!seen.has(key)) {
        fallbackPool.push(item);
      }
    }
  }

  // 날짜 필터 결과가 부족하면 폴백 풀로 채움
  for (const item of fallbackPool) {
    const key = `${item.title}|${item.link}`;
    if (seen.has(key)) continue;
    seen.add(key);
    collected.push(item);
    if (collected.length >= 3) return collected;
  }

  return collected;
}

async function buildRowFromSource(params: {
  category: string;
  subInterest: string;
  item: FeedItem;
  date: string;
  index: number;
}) {
  const { category, subInterest, item, date, index } = params;
  const summaryType = SUMMARY_TYPE_ORDER[index % SUMMARY_TYPE_ORDER.length];
  const categorySlug = CATEGORY_SLUG_MAP[category] ?? "brief";
  const subInterestSlug = SUB_INTEREST_SLUG_MAP[subInterest] ?? `sub-${index + 1}`;
  const slug = `brief-${date}-${categorySlug}-${subInterestSlug}-${index + 1}`;
  const rawText = [
    `원문 제목: ${item.title}`,
    item.description ? `원문 요약: ${item.description}` : "",
    `출처: ${item.sourceName}`,
    item.publishedAt ? `발행 시각: ${item.publishedAt}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const summarized = await summarizeContentItem({
    title: item.title,
    category,
    rawText,
    summaryType
  });

  return {
    title: sanitizePlainText(summarized.title, 20),
    category: getStoredCategoryForMainInterest(category),
    sub_interest: subInterest,
    source_name: sanitizePlainText(item.sourceName, 120),
    source_url: item.link,
    sources: [
      {
        name: sanitizePlainText(item.sourceName, 120),
        url: item.link,
        type: item.type
      }
    ],
    raw_text: sanitizePlainText(rawText, 4000),
    short_summary: sanitizePlainText(summarized.shortSummary, 300),
    long_summary: sanitizePlainText(summarized.longSummary, 4000),
    action_line: sanitizePlainText(summarized.actionLine, 160),
    summary_type: summarized.summaryType,
    approval_status: "approved",
    ai_status: "completed",
    summary_status: "done",
    published_at: item.publishedAt ?? buildPublishedAtFallback(date, index * 2),
    slug,
    updated_at: new Date().toISOString()
  };
}

/**
 * AI 요약 실패 시 원문 기반 최소 폴백 row 생성.
 * 요약은 비어있지만 slug/category/sub_interest는 보장되어 25개 카운트가 유지됨.
 */
function buildFallbackRow(params: {
  category: string;
  subInterest: string;
  item: FeedItem;
  date: string;
  index: number;
}): Record<string, unknown> {
  const { category, subInterest, item, date, index } = params;
  const summaryType = SUMMARY_TYPE_ORDER[index % SUMMARY_TYPE_ORDER.length];
  const categorySlug = CATEGORY_SLUG_MAP[category] ?? "brief";
  const subInterestSlug = SUB_INTEREST_SLUG_MAP[subInterest] ?? `sub-${index + 1}`;
  const slug = `brief-${date}-${categorySlug}-${subInterestSlug}-${index + 1}`;
  const rawText = [
    `원문 제목: ${item.title}`,
    item.description ? `원문 요약: ${item.description}` : "",
    `출처: ${item.sourceName}`,
    item.publishedAt ? `발행 시각: ${item.publishedAt}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: sanitizePlainText(item.title, 20),
    category: getStoredCategoryForMainInterest(category),
    sub_interest: subInterest,
    source_name: sanitizePlainText(item.sourceName, 120),
    source_url: item.link,
    sources: [{ name: sanitizePlainText(item.sourceName, 120), url: item.link, type: item.type }],
    raw_text: sanitizePlainText(rawText, 4000),
    short_summary: sanitizePlainText(item.description ?? item.title, 300),
    long_summary: sanitizePlainText(rawText, 4000),
    action_line: "",
    summary_type: summaryType,
    approval_status: "approved",
    ai_status: "fallback",
    summary_status: "done",
    published_at: item.publishedAt ?? buildPublishedAtFallback(date, index * 2),
    slug,
    thumbnail_url: null,
    thumbnail_alt: null,
    thumbnail_page_url: null,
    thumbnail_author: null,
    thumbnail_license: null,
    updated_at: new Date().toISOString()
  };
}

/**
 * 카테고리 1개에 대해 서브카테고리 전체(5개)를 병렬 처리.
 * 서브카테고리당 1개 기사 = 카테고리당 5개 기사.
 * summary_type은 서브카테고리 인덱스 기반으로 MUST/USEFUL/ACTION 순환 배정.
 * RSS 0건이거나 AI 요약 실패 시에도 폴백 row를 생성하여 항상 5개 보장.
 */
async function generateCategoryArticles(
  category: string,
  date: string,
  globalIndex: number
): Promise<Array<Record<string, unknown>>> {
  const subInterests = (SUB_INTERESTS as Record<string, string[]>)[category] ?? [];

  // 모든 서브카테고리 RSS 수집을 병렬로
  const sourceResults = await Promise.allSettled(
    subInterests.map((sub: string) => collectSourceItemsForSubInterest(sub, date))
  );

  // 각 서브카테고리에서 1개 기사를 선택하고 빌드 (병렬)
  // RSS 0건인 경우에도 buildTask를 건너뛰지 않고, 해당 케이스는 나중에 처리
  const buildTasks: Array<Promise<Record<string, unknown> | null>> = [];

  for (let i = 0; i < subInterests.length; i++) {
    const result = sourceResults[i];
    const articleIndex = globalIndex + i;
    const subInterest = subInterests[i];

    // RSS 수집 자체 실패 → 스킵 (소스 없음)
    if (result.status !== "fulfilled" || result.value.length === 0) {
      console.warn("[rss-empty]", category, subInterest, "→ 수집된 기사 없음, 스킵");
      continue;
    }

    const item = result.value[0];

    buildTasks.push(
      buildRowFromSource({ category, subInterest, item, date, index: articleIndex })
        .then((built) => {
          const row: Record<string, unknown> = { ...built };
          // 썸네일은 별도 repair-thumbnails cron에서 채움 (생성 속도 우선)
          row.thumbnail_url = null;
          row.thumbnail_alt = null;
          row.thumbnail_page_url = null;
          row.thumbnail_author = null;
          row.thumbnail_license = null;
          return row;
        })
        .catch((err) => {
          // AI 요약 실패 → 원문 기반 폴백 row로 대체 (null 반환 대신)
          console.error("[article-build-error] AI 요약 실패, 폴백 row 사용:", category, subInterest, err);
          return buildFallbackRow({ category, subInterest, item, date, index: articleIndex });
        })
    );
  }

  const results = await Promise.allSettled(buildTasks);
  const articles: Array<Record<string, unknown>> = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      articles.push(r.value);
    }
  }

  return articles;
}

export async function generateDailyContentForDate(date = getKstDateParts().date) {
  const supabase = createAdminSupabaseClient();

  // 5개 카테고리를 병렬로 처리 (각 5개 서브카테고리 = 총 25개 기사)
  const categoryResults = await Promise.allSettled(
    MAIN_INTERESTS.map((category, catIdx) =>
      generateCategoryArticles(category, date, catIdx * 5)
    )
  );

  const rows: Array<Record<string, unknown>> = [];
  for (const result of categoryResults) {
    if (result.status === "fulfilled") {
      rows.push(...result.value);
    }
  }

  if (rows.length > 0) {
    const { data: inserted, error } = await supabase
      .from("content_items")
      .upsert(rows, { onConflict: "slug" })
      .select("id, audio_url");
    if (error) {
      throw error;
    }

    // TTS 자동 생성 (audio_url 이 아직 없는 것만). 승인은 이미 upsert 로 됐음.
    // fire-and-forget — 실패해도 cron 결과에 영향 X. 여러 건이라 병렬 최대 3개로 제한.
    const toGenerate = (inserted ?? []).filter((row) => !row.audio_url).map((row) => String(row.id));
    if (toGenerate.length > 0) {
      void (async () => {
        const CONCURRENCY = 3;
        for (let i = 0; i < toGenerate.length; i += CONCURRENCY) {
          await Promise.all(
            toGenerate.slice(i, i + CONCURRENCY).map((id) =>
              generateAndStoreContentAudio(id).catch((error) => {
                console.warn("[auto-generate] audio failed", { id, error: (error as Error).message });
              })
            )
          );
        }
      })();
    }
  }

  return { date, count: rows.length };
}
