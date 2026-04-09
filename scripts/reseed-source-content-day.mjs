import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

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

const env = {
  ...loadEnvFile(".env.local"),
  ...process.env
};

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_ENV_MISSING");
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function getKstDateString(date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

const TODAY_KST = process.env.CONTENT_SEED_DATE?.trim() || getKstDateString(new Date());

const STORED_CATEGORY_BY_MAIN_INTEREST = {
  건강: "건강",
  돈: "돈",
  실생활: "취미",
  뉴스: "뉴스",
  관계: "가족"
};

const TAXONOMY = {
  건강: {
    혈압: ["혈압 관리", "고혈압", "혈압 측정"],
    관절: ["관절 통증", "무릎 건강", "어깨 통증"],
    음식: ["건강 음식", "식단 관리", "영양 식품"],
    상식: ["건강 상식", "의학 상식", "생활 건강"],
    병원: ["병원 이용", "진료 안내", "병원 진료"]
  },
  돈: {
    연금: ["연금 수령", "국민연금", "퇴직연금"],
    세금: ["세금 신고", "홈택스", "절세"],
    보험: ["보험", "건강보험", "실손보험"],
    주의: ["금융사기 주의", "소비자 주의", "보이스피싱"],
    혜택: ["지원 혜택", "복지 혜택", "정부 혜택"]
  },
  실생활: {
    꿀팁: ["생활 꿀팁", "생활 정보", "정리 팁"],
    가전: ["가전 관리", "가전 청소", "전자제품 관리"],
    청소: ["청소 팁", "집 청소", "정리정돈"],
    요리: ["간단 요리", "집밥 레시피", "요리 팁"],
    교통: ["교통 정보", "대중교통", "교통 정책"]
  },
  뉴스: {
    "주요 뉴스": ["주요 뉴스", "오늘 뉴스", "속보"],
    경제: ["경제 뉴스", "환율 물가", "금리 경제"],
    정책: ["정책 발표", "제도 변경", "정책 변화"],
    사회: ["사회 뉴스", "생활 사회", "안전 교육"],
    해외: ["해외 뉴스", "국제 뉴스", "글로벌 경제"]
  },
  관계: {
    가족: ["가족 관계", "돌봄 가족", "양육 가족"],
    부부: ["부부 관계", "가사 분담", "부부 대화"],
    회사: ["직장 소통", "회사 관계", "직장인 업무"],
    취미: ["취미 생활", "문화 생활", "여가 활동"],
    친구: ["친구 관계", "대인관계", "인간관계"]
  }
};

const MATCH_KEYWORDS = {
  건강: {
    혈압: ["혈압", "고혈압", "저혈압", "혈관"],
    관절: ["관절", "무릎", "어깨", "허리", "척추", "손목", "연골", "오십견"],
    음식: ["음식", "식품", "식단", "요리", "영양", "반찬", "레시피"],
    상식: ["건강", "검사", "치과", "치아", "약", "의사", "증상"],
    병원: ["병원", "진료", "의료", "응급", "예약", "환자"]
  },
  돈: {
    연금: ["연금", "국민연금", "기초연금", "퇴직연금", "수급"],
    세금: ["세금", "종소세", "부가세", "소득세", "신고", "공제", "홈택스"],
    보험: ["보험", "실손", "실비", "보장", "생명보험", "건강보험"],
    주의: ["사기", "피싱", "주의", "피해", "사칭", "불법", "경고"],
    혜택: ["지원", "혜택", "복지", "할인", "쿠폰", "바우처", "신청"]
  },
  실생활: {
    꿀팁: ["팁", "꿀팁", "정리", "생활", "요령"],
    가전: ["가전", "전자제품", "냉장고", "세탁기", "청소기", "에어컨"],
    청소: ["청소", "정리", "수납", "세탁"],
    요리: ["요리", "레시피", "집밥", "조리", "반찬"],
    교통: ["교통", "버스", "지하철", "철도", "도로", "운행", "우회"]
  },
  뉴스: {
    "주요 뉴스": ["현안", "속보", "발표", "회의", "점검", "주요", "오늘"],
    경제: ["경제", "실적", "물가", "금리", "환율", "증시", "투자", "주가"],
    정책: ["정책", "공약", "제도", "시행", "개편", "지원", "발표"],
    사회: ["사회", "청소년", "교육", "안전", "복지", "지역", "환경", "사건", "사고"],
    해외: ["해외", "국제", "미국", "중국", "일본", "유럽", "글로벌", "세계", "유가", "환율"]
  },
  관계: {
    가족: ["가족", "양육", "보호자", "부모", "자녀", "돌봄"],
    부부: ["부부", "배우자", "가사", "혼인", "대화"],
    회사: ["직장", "회사", "근무", "업무", "노조", "월급"],
    취미: ["취미", "문화", "여가", "독서", "여행", "사진", "전시"],
    친구: ["친구", "대인관계", "인간관계", "우정"]
  }
};

const BLOCKED_SOURCE_NAMES = new Set([
  "네이트",
  "다음",
  "네이버",
  "브런치",
  "뉴스초대석",
  "스포츠서울",
  "sports.donga.com",
  "iMBC 연예",
  "한국뉴스TV"
]);

const NOISY_PATTERNS = [
  /괴담/iu,
  /정체 밝혀/iu,
  /무서운/iu,
  /충격/iu,
  /뭐길래/iu,
  /연예/iu,
  /오늘의 주요뉴스/iu,
  /뉴스초대석/iu
];

function sanitize(text, limit = 4000) {
  return String(text ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'");
}

function stripHtml(value) {
  return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeNewsTitle(title, sourceName = "") {
  return sanitize(title, 240)
    .replace(sourceName ? new RegExp(sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi") : /$^/, "")
    .replace(/\[(기고|칼럼|사설|오피니언|기자수첩)[^\]]*\]/giu, " ")
    .replace(/\{(기고|칼럼|사설|오피니언|기자수첩)[^}]*\}/giu, " ")
    .replace(/\((기고|칼럼|사설|오피니언|기자수첩)[^)]*\)/giu, " ")
    .replace(/(기고|칼럼|사설|오피니언|기자수첩)\s*\/?\s*[가-힣A-Za-z]+/giu, " ")
    .replace(/[“”"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatKstDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function parseItems(xml) {
  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  return itemBlocks
    .map((block) => {
      const title = stripHtml((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").replace(/\s+-\s+[^-]+$/, "").trim();
      const link = decodeHtml((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "");
      const description = stripHtml((block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || "");
      const pubDate = ((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || "").trim();
      const sourceName = stripHtml((block.match(/<source(?:\s[^>]*)?>([\s\S]*?)<\/source>/i) || [])[1] || "") || "출처 미상";
      if (!title || !link || !pubDate) return null;
      const publishedAt = new Date(pubDate).toISOString();
      const kstDate = formatKstDate(publishedAt);
      return { title, link, description, sourceName, publishedAt, kstDate };
    })
    .filter(Boolean);
}

function fetchGoogleNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:1d`)}&hl=ko&gl=KR&ceid=KR:ko`;
  const xml = execFileSync(
    "curl",
    ["-sL", "--max-time", "8", "-A", "Mozilla/5.0 (compatible; SejulachimBot/1.0; +https://sejulachim.studiobyyou.kr)", url],
    { encoding: "utf8" }
  );
  return parseItems(xml);
}

function resolveFinalUrl(url) {
  const resolved = execFileSync("curl", ["-sL", "--max-time", "8", "-o", "/dev/null", "-w", "%{url_effective}", url], {
    encoding: "utf8"
  }).trim();
  return resolved || url;
}

function fetchHtml(url) {
  return execFileSync(
    "curl",
    ["-sL", "--max-time", "8", "-A", "Mozilla/5.0 (compatible; SejulachimBot/1.0; +https://sejulachim.studiobyyou.kr)", url],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }
  );
}

function extractMetaContent(html, attr, value) {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]).trim();
  }
  return "";
}

function extractParagraphs(html) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");

  const matches = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  const seen = new Set();
  const paragraphs = [];

  for (const match of matches) {
    const text = stripHtml(match[1]);
    const normalized = sanitize(text, 600);
    if (!normalized || normalized.length < 28) continue;
    if (/무단 전재|재배포 금지|기자|저작권자|구독|광고|제보|메일|저작권|무단전재|AI 요약|기사원문|본문 링크|기자명/u.test(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    paragraphs.push(normalized);
  }

  return paragraphs;
}

function splitSentences(text) {
  return sanitize(text, 3000)
    .split(/(?<=[.!?]|다\.)\s+/u)
    .map((part) => sanitize(part, 320))
    .filter(Boolean);
}

function ensureSentence(text) {
  const value = sanitize(text, 320);
  if (!value) return "";
  return /[.!?]$/u.test(value) ? value : `${value}.`;
}

function buildDisplayTitle(title, subInterest) {
  const cleaned = normalizeNewsTitle(title);
  const parts = cleaned
    .split(/[:\-–—]|,\s*|…|\.\.\./)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part.length >= 5 && part.length <= 26)
    .filter((part) => !NOISY_PATTERNS.some((pattern) => pattern.test(part)));
  return sanitize(parts[0] || cleaned || `${subInterest} 핵심`, 28);
}

function buildShortSummary(article) {
  const bodySentences = splitSentences(article.bodyText)
    .filter((sentence) => sentence.length >= 22)
    .filter((sentence) => !sentence.includes("출처:"))
    .filter((sentence) => !sentence.includes("카테고리:"))
    .filter((sentence) => !sentence.includes("세부카테고리:"))
    .filter((sentence) => !sentence.includes("기자"))
    .filter((sentence) => !sentence.includes(article.sourceName));

  const picked = [];
  for (const sentence of bodySentences) {
    if (picked.length >= 2) break;
    const normalized = ensureSentence(sentence);
    if (!normalized) continue;
    if (picked.some((existing) => existing === normalized)) continue;
    picked.push(normalized);
  }

  if (picked.length === 0 && article.description) {
    picked.push(ensureSentence(article.description));
  }

  return sanitize(picked.join(" "), 440);
}

function buildLongSummary(article) {
  const paragraphs = article.bodyParagraphs
    .map((paragraph) => sanitize(paragraph, 1200))
    .filter(Boolean)
    .filter((paragraph) => !NOISY_PATTERNS.some((pattern) => pattern.test(paragraph)))
    .filter((paragraph) => !paragraph.includes("출처:"))
    .filter((paragraph) => !paragraph.includes("카테고리:"))
    .filter((paragraph) => !paragraph.includes("세부카테고리:"))
    .filter((paragraph) => !paragraph.includes(article.sourceName))
    .filter((paragraph) => !/기자\s*[=:/]/u.test(paragraph))
    .filter((paragraph) => !/무단 전재|재배포 금지|저작권자/u.test(paragraph));

  return sanitize(paragraphs.join(" "), 10000);
}

function buildActionLine(article) {
  const bodySentences = splitSentences(article.bodyText)
    .filter((sentence) => sentence.length >= 18)
    .filter((sentence) => !sentence.includes(article.sourceName))
    .filter((sentence) => !sentence.includes("출처:"));
  const first = bodySentences.find((sentence) => sentence.length >= 20);
  if (first) {
    return sanitize(first, 140);
  }
  return sanitize(article.shortSummary || article.displayTitle, 140);
}

function hasRelevantKeyword(category, subInterest, text) {
  const keywords = MATCH_KEYWORDS[category]?.[subInterest] ?? [];
  if (keywords.length === 0) return true;
  const haystack = text.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function createSlug(category, subInterest, index, kstDate) {
  const categorySlug = sanitize(category, 20).toLowerCase().replace(/\s+/g, "-");
  const subSlug = sanitize(subInterest, 20).toLowerCase().replace(/\s+/g, "-");
  return `real-${kstDate}-${categorySlug}-${subSlug}-${index + 1}`;
}

async function collectArticlesForSubInterest(category, subInterest, queries) {
  const seenUrls = new Set();
  const articles = [];

  for (const query of queries.slice(0, 1)) {
    const items = fetchGoogleNews(query).slice(0, 4);
    for (const item of items) {
      if (BLOCKED_SOURCE_NAMES.has(item.sourceName)) continue;
      if (NOISY_PATTERNS.some((pattern) => pattern.test(item.title) || pattern.test(item.description) || pattern.test(item.sourceName))) continue;

      let finalUrl = item.link;
      try {
        finalUrl = resolveFinalUrl(item.link);
      } catch {
        finalUrl = item.link;
      }

      if (!finalUrl || seenUrls.has(finalUrl)) continue;
      seenUrls.add(finalUrl);

      let html = "";
      try {
        html = fetchHtml(finalUrl);
      } catch {
        continue;
      }

      const bodyParagraphs = extractParagraphs(html);
      const bodyText = sanitize(bodyParagraphs.join(" "), 12000);
      if (!bodyParagraphs.length || bodyText.length < 240) continue;

      const sourceTitle = extractMetaContent(html, "property", "og:title") || extractMetaContent(html, "name", "twitter:title") || item.title;
      const sourceDescription =
        extractMetaContent(html, "property", "og:description") || extractMetaContent(html, "name", "description") || item.description;
      const thumbnailUrl =
        extractMetaContent(html, "property", "og:image") || extractMetaContent(html, "name", "twitter:image") || null;

      const combined = `${sourceTitle} ${sourceDescription} ${bodyText}`;
      if (!hasRelevantKeyword(category, subInterest, combined)) continue;

      const displayTitle = buildDisplayTitle(sourceTitle, subInterest);
      const article = {
        sourceName: item.sourceName,
        sourceUrl: finalUrl,
        publishedAt: item.publishedAt,
        kstDate: item.kstDate,
        sourceTitle: sanitize(sourceTitle, 260),
        description: sanitize(sourceDescription, 600),
        bodyParagraphs,
        bodyText,
        displayTitle,
        thumbnailUrl
      };

      article.shortSummary = buildShortSummary(article);
      article.longSummary = buildLongSummary(article);
      article.actionLine = buildActionLine(article);

      if (!article.shortSummary || !article.longSummary) continue;

      articles.push(article);
      if (articles.length >= 3) return articles;
    }
  }

  return articles;
}

async function clearExistingContentData() {
  const { data: contentItems } = await supabase.from("content_items").select("id, slug");
  const contentIds = (contentItems ?? []).map((row) => row.id);
  const contentSlugs = (contentItems ?? []).map((row) => row.slug).filter(Boolean);

  if (contentIds.length > 0) {
    await supabase.from("favorites").delete().in("content_item_id", contentIds);
  }
  if (contentSlugs.length > 0) {
    await supabase.from("favorites").delete().in("content_slug", contentSlugs);
  }

  const wipeAll = async (table) => {
    await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  };

  await wipeAll("shared_comments");
  await wipeAll("shared_links");
  await wipeAll("notifications");
  await wipeAll("email_logs");
  await wipeAll("daily_pick_items");
  await wipeAll("daily_picks");
  await wipeAll("job_logs");
  await wipeAll("content_items");
}

async function main() {
  const rows = [];

  for (const [category, subMap] of Object.entries(TAXONOMY)) {
    for (const [subInterest, queries] of Object.entries(subMap)) {
      const articles = await collectArticlesForSubInterest(category, subInterest, queries);
      for (const [index, article] of articles.entries()) {
        rows.push({
          slug: createSlug(category, subInterest, index, article.kstDate),
          title: article.displayTitle,
          category: STORED_CATEGORY_BY_MAIN_INTEREST[category] ?? category,
          sub_interest: subInterest,
          summary_type: ["MUST", "USEFUL", "ACTION"][index % 3],
          source_name: article.sourceName,
          source_url: article.sourceUrl,
          sources: [{ name: article.sourceName, url: article.sourceUrl, type: "news" }],
          short_summary: article.shortSummary,
          long_summary: article.longSummary,
          action_line: article.actionLine,
          raw_text: sanitize(
            [`원문 제목: ${article.sourceTitle}`, `원문 요약: ${article.description}`, `원문 본문: ${article.bodyText}`].join("\n"),
            12000
          ),
          approval_status: "approved",
          ai_status: "completed",
          summary_status: "done",
          published_at: article.publishedAt,
          thumbnail_url: article.thumbnailUrl,
          thumbnail_alt: article.displayTitle,
          thumbnail_page_url: article.sourceUrl,
          thumbnail_author: null,
          thumbnail_license: null,
          created_at: article.publishedAt,
          updated_at: new Date().toISOString()
        });
      }
    }
  }

  await clearExistingContentData();

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("content_items").insert(rows);
    if (insertError) throw insertError;
  }

  const availableDates = [...new Set(rows.map((row) => formatKstDate(row.published_at)))].sort().reverse();
  const targetDate = availableDates[0] ?? TODAY_KST;
  const todayRows = rows.filter((row) => formatKstDate(row.published_at) === targetDate);
  if (todayRows.length > 0) {
    const dailyPickId = crypto.randomUUID();
    const { error: pickError } = await supabase.from("daily_picks").insert({
      id: dailyPickId,
      pick_date: targetDate,
      status: "ready",
      created_at: new Date().toISOString(),
      generated_at: new Date().toISOString()
    });
    if (pickError) throw pickError;

    const { data: insertedRows, error: insertedRowsError } = await supabase
      .from("content_items")
      .select("id, slug, summary_type")
      .in("slug", todayRows.map((item) => item.slug));
    if (insertedRowsError) throw insertedRowsError;

    const picked = ["MUST", "USEFUL", "ACTION"]
      .map((type) => (insertedRows ?? []).find((item) => item.summary_type === type))
      .filter(Boolean)
      .map((item, index) => ({
        daily_pick_id: dailyPickId,
        content_item_id: item.id,
        position: index + 1
      }));

    if (picked.length > 0) {
      const { error: pickItemsInsertError } = await supabase.from("daily_pick_items").insert(picked);
      if (pickItemsInsertError) throw pickItemsInsertError;
    }
  }

  const countBySubInterest = Object.fromEntries(
    Object.entries(TAXONOMY).flatMap(([category, subMap]) =>
      Object.keys(subMap).map((subInterest) => [
        `${category}>${subInterest}`,
        rows.filter((row) => row.sub_interest === subInterest).length
      ])
    )
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        requestedDate: TODAY_KST,
        generatedDate: targetDate,
        count: rows.length,
        countBySubInterest,
        samples: rows.slice(0, 8).map((item) => ({
          slug: item.slug,
          title: item.title,
          source_name: item.source_name,
          source_url: item.source_url
        }))
      },
      null,
      2
    )
  );
}

await main();
