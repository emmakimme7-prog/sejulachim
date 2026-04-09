/**
 * 썸네일 교체 스크립트 (OpenAI 없이, Claude가 직접 쿼리 작성)
 * node scripts/smart-thumbnail-update.mjs [--slug=<slug>]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

// Claude가 직접 작성한 slug별 검색 쿼리
// 각 아이템의 한국어 제목/내용을 분석해서 영어로 변환
const SLUG_QUERIES = {
  // 2026-04-09
  "brief-2026-04-09-health-blood-pressure-1": ["sodium salt shaker healthy food", "low sodium diet vegetables healthy"],
  "brief-2026-04-09-health-joint-1":          ["spring hiking knee stretching outdoor", "knee joint protection exercise outdoor"],
  "brief-2026-04-09-health-food-1":           ["protein fiber healthy meal plate", "balanced nutrition food vegetables grains"],
  "brief-2026-04-09-health-common-sense-1":   ["exhausted tired fatigue chronic sleepy", "spring fatigue tiredness desk office"],
  "brief-2026-04-09-health-hospital-1":       ["smartwatch health monitoring wrist fitness", "wearable device health tracker smartwatch"],
  "brief-2026-04-09-money-pension-1":         ["national pension savings retirement plan", "pension piggy bank retirement elderly"],
  "brief-2026-04-09-money-tax-1":             ["income tax filing calculator documents", "tax return form deadline paperwork"],
  "brief-2026-04-09-money-insurance-1":       ["health insurance document policy form", "medical insurance renewal coverage plan"],
  "brief-2026-04-09-money-warning-1":         ["voice phishing AI scam phone fraud", "phone scam warning security alert"],
  "brief-2026-04-09-money-benefit-1":         ["government cash relief benefit payment", "oil price subsidy government support money"],
  "brief-2026-04-09-daily-tips-1":            ["credit card points rewards cashback", "credit card rewards point redemption"],
  "brief-2026-04-09-daily-appliance-1":       ["washing machine dryer laundry tower", "modern washer dryer stacked laundry"],
  "brief-2026-04-09-daily-cleaning-1":        ["home cleaning spray cloth doorknob", "deep cleaning house disinfect wipe"],
  "brief-2026-04-09-daily-cooking-1":         ["Korean namul vegetable side dish bowl", "spring greens seasoned Korean banchan"],
  "brief-2026-04-09-daily-traffic-1":         ["transit pass card subway bus commuter", "public transport metro card tap"],
  "brief-2026-04-09-news-top-news-1":         ["US Iran diplomacy ceasefire negotiation", "peace deal handshake flags diplomacy"],
  "brief-2026-04-09-news-economy-1":          ["semiconductor chip factory technology", "computer chip semiconductor manufacturing"],
  "brief-2026-04-09-news-policy-1":           ["oil price government budget relief fund", "government policy announcement economy aid"],
  "brief-2026-04-09-news-society-1":          ["identity theft cybercrime security lock", "identity fraud cybersecurity police"],
  "brief-2026-04-09-news-global-1":           ["strait of Hormuz oil tanker ship sea", "oil tanker ship ocean shipping route"],
  "brief-2026-04-09-relation-family-1":       ["asian family eating dinner together table", "parents children meal dining table happy"],
  "brief-2026-04-09-relation-couple-1":       ["couple talking calmly sofa conversation", "husband wife discussion living room"],
  "brief-2026-04-09-relation-office-1":       ["office chat message workplace computer", "business communication laptop office desk"],
  "brief-2026-04-09-relation-hobby-1":        ["home baking cookies oven kitchen", "baking bread dough kitchen flour"],
  "brief-2026-04-09-relation-friend-1":       ["friends meeting coffee cafe chatting", "old friends reunion conversation warm"],

  // 2026-04-08
  "brief-2026-04-08-relation-friend-1":   ["single person household social network", "alone apartment city lifestyle"],
  "brief-2026-04-08-news-global-1":        ["diplomacy peace agreement handshake flag", "negotiation ceasefire diplomatic meeting"],
  "brief-2026-04-08-money-benefit-1":      ["electric vehicle charging station", "EV car charging port subsidy"],
  "brief-2026-04-08-health-hospital-1":    ["medical AI technology hospital doctor screen", "healthcare artificial intelligence diagnosis"],
  "brief-2026-04-08-daily-traffic-1":      ["traffic car restriction city road odd even", "commute road rule enforcement"],
  "brief-2026-04-08-news-society-1":       ["grocery food price inflation supermarket", "rising food costs family budget"],

  // 2026-04-07
  "brief-2026-04-07-daily-cooking-1":      ["spring herb cooking recipe fresh greens", "fusion recipe seasonal vegetables"],
  "brief-2026-04-07-relation-hobby-1":     ["hobby social activity friends outdoor", "leisure experience friendship group"],
  "brief-2026-04-07-money-benefit-1":      ["transit card public transportation cashback", "bus subway commuter benefit refund"],
  "brief-2026-04-07-health-common-sense-1":["sleep quality assessment questionnaire", "sleep disorder diagnosis AI app"],
  "brief-2026-04-07-relation-couple-1":    ["international couple cultural difference", "multicultural marriage family communication"],
  "brief-2026-04-07-health-food-1":        ["soy milk oat milk comparison blood sugar", "plant milk healthy drink nutrition"],
  "brief-2026-04-07-news-policy-1":        ["university campus education policy meeting", "higher education regulation committee"],
  "brief-2026-04-07-money-warning-1":      ["voice phishing scam phone fraud alert", "AI fraud detection phone security"],
  "brief-2026-04-07-daily-cleaning-1":     ["air conditioner cleaning filter maintenance", "AC unit home care self cleaning"],
  "brief-2026-04-07-news-top-news-1":      ["politicians meeting press conference discussion", "parliamentary conference economic crisis"],

  // 2026-04-06
  "brief-2026-04-06-daily-appliance-1":    ["AI smart kitchen appliance modern cooking", "smart home appliance high tech kitchen"],
  "brief-2026-04-06-relation-office-1":    ["young worker resignation office quit job", "government office worker leaving career"],
  "brief-2026-04-06-money-insurance-1":    ["insurance policy document obligation penalty", "insurance contract disclosure requirement"],
  "brief-2026-04-06-health-common-sense-1":["sleep optimization bedroom night quality rest", "sleep maximizing routine dark room"],
  "brief-2026-04-06-health-joint-1":       ["elderly knee arthritis joint pain senior", "osteoarthritis senior care knee brace"],
  "brief-2026-04-06-relation-family-1":    ["single parent diverse family household modern", "non-married family growing urban"],
  "brief-2026-04-06-news-global-1":        ["nuclear plant ocean water pollution sea", "Fukushima ocean contamination marine"],
  "brief-2026-04-06-daily-tips-1":         ["traffic law road sign rule change", "driving regulation update new law"],
  "brief-2026-04-06-money-tax-1":          ["dividend stock tax income separate form", "stock market investment tax benefit"],
  "brief-2026-04-06-news-economy-1":       ["national debt government finance economy graph", "public debt trillion economy crisis"],

  // 2026-04-05
  "brief-2026-04-05-daily-traffic-1":      ["bus subway fare peak hour pricing", "public transport dynamic pricing ticket"],
  "brief-2026-04-05-money-warning-1":      ["cryptocurrency exchange withdrawal delay security", "crypto regulation security coins digital"],
  "brief-2026-04-05-health-hospital-1":    ["cancer immunotherapy drug treatment hospital", "cancer medication insurance reduction patient"],
  "brief-2026-04-05-relation-friend-1":    ["AI chatbot loneliness companionship screen", "robot companion friendship loneliness"],
  "brief-2026-04-05-daily-cooking-1":      ["squid octopus seafood spring Korean cooking", "fresh octopus seafood dish recipe"],
  "brief-2026-04-05-money-pension-1":      ["retirement pension tax benefit savings plan", "pension fund tax deduction retirement"],
  "brief-2026-04-05-health-common-sense-1":["antibiotic resistance bacteria superbug warning", "drug resistant bacteria hospital infection"],
  "brief-2026-04-05-news-policy-1":        ["housing loan mortgage regulation bank property", "multi-home owner loan restriction policy"],
  "brief-2026-04-05-relation-hobby-1":     ["night outdoor chase game young adults city", "urban night running game tag activity"],
  "brief-2026-04-05-health-food-1":        ["nutrition quality healthy food eating mindful", "food nutritional value quality diet"],
  "brief-2026-04-05-daily-cleaning-1":     ["bathroom mold tiles cleaning prevention grout", "shower mold removal bathroom deep clean"],
  "brief-2026-04-05-relation-office-1":    ["workplace burnout stress office exhaustion tired", "employee burnout work overload stress"],
  "brief-2026-04-05-news-society-1":       ["stalking safety protection app location", "stalker surveillance GPS safety protection"],

  // 2026-04-04
  "brief-2026-04-04-money-insurance-1":    ["car insurance premium increase auto cost", "automobile insurance rate price rise"],
  "brief-2026-04-04-money-tax-1":          ["YouTuber content creator tax income filing", "social media influencer income tax report"],
  "brief-2026-04-04-health-joint-1":       ["chondroitin glucosamine joint supplement bottle", "joint health supplement capsule elderly"],
  "brief-2026-04-04-news-top-news-1":      ["courtroom justice legal trial verdict korea", "courthouse justice gavel legal proceeding"],
  "brief-2026-04-04-daily-appliance-1":    ["energy efficient appliance refrigerator washer home", "high efficiency home appliance subsidy"],
  "brief-2026-04-04-relation-couple-1":    ["holiday family stress couple conflict stress", "traditional holiday family gathering tension"],
  "brief-2026-04-04-money-pension-1":      ["elderly pension benefit increase senior welfare", "basic pension senior monthly payment"],
  "brief-2026-04-04-relation-family-1":    ["working mother childcare family daycare", "mom working child care baby family"],
  "brief-2026-04-04-news-economy-1":       ["currency exchange rate won dollar fluctuation", "foreign exchange market economy inflation"],
  "brief-2026-04-04-daily-tips-1":         ["transit card commuter cashback reward benefit", "commuter pass transport discount card"],
  "brief-2026-04-04-health-blood-pressure-1": ["leg circulation vein peripheral artery health check", "leg vascular health check senior"],

  // 2026-04-03
  "brief-2026-04-03-daily-traffic-1":      ["autonomous self-driving taxi city street urban", "self-driving car robotaxi technology"],
  "brief-2026-04-03-health-hospital-1":    ["hospital outpatient visit medical cost copay", "clinic medical expense patient payment"],
  "brief-2026-04-03-relation-friend-1":    ["young people relationship social anxiety worry", "youth friends social connection stress"],
  "brief-2026-04-03-money-benefit-1":      ["government voucher coupon discount shopping", "consumer subsidy voucher benefit apply"],
  "brief-2026-04-03-news-policy-1":        ["oil price fuel crisis car restriction city", "gasoline energy shortage road rationing"],
  "brief-2026-04-03-daily-cooking-1":      ["spring vegetables greens simple Korean dish", "spring herb namul wild greens cooking"],
  "brief-2026-04-03-news-society-1":       ["subway tunnel collapse construction inspection", "underground construction failure safety check"],
  "brief-2026-04-03-relation-hobby-1":     ["running group community joggers outdoor park", "running crew social city park group"],
  "brief-2026-04-03-health-food-1":        ["meat garlic combination nutrition cooking", "pork garlic cooking health benefit"],
  "brief-2026-04-03-money-warning-1":      ["SMS phishing scam text message fraud smartphone", "smishing fraud phone text scam warning"],
  "brief-2026-04-03-news-global-1":        ["military fighter aircraft conflict sky", "air force jet aircraft geopolitics defense"],
  "brief-2026-04-03-daily-cleaning-1":     ["spring cleaning home declutter organized fresh", "deep cleaning house spring season"],
  "brief-2026-04-03-health-blood-pressure-1": ["blood pressure monitor smartphone app wearable", "digital blood pressure health app monitor"],
  "brief-2026-04-03-money-insurance-1":    ["health insurance plan document form coverage", "medical insurance renewal policy health"],

  // 2026-04-02
  "brief-2026-04-02-relation-office-1":    ["workplace harassment bullying complaint office", "office harassment report victim support"],
  "brief-2026-04-02-money-tax-1":          ["inheritance estate tax planning child family", "inheritance tax document form family property"],
  "brief-2026-04-02-daily-appliance-1":    ["washer dryer combo all-in-one laundry machine", "laundry washing drying appliance modern"],
  "brief-2026-04-02-news-economy-1":       ["export cargo ship port container trade", "shipping port cargo economic growth export"],
  "brief-2026-04-02-relation-couple-1":    ["couple wedding planning financial burden housing", "engaged couple housing cost financial stress"],
  "brief-2026-04-02-health-joint-1":       ["runner knee pain injury prevention young", "running knee pain athlete injury joint"],
  "brief-2026-04-02-daily-tips-1":         ["hospital medical cost compare search online", "medical fee comparison outpatient cost"],
  "brief-2026-04-02-money-pension-1":      ["national pension premium rate contribution increase", "pension contribution monthly rate reform"],
  "brief-2026-04-02-news-top-news-1":      ["moon mission astronaut space rocket launch", "Artemis NASA moon space mission crew"],
  "brief-2026-04-02-health-blood-pressure-1": ["boxing exercise workout blood pressure cardiovascular", "boxing training health fitness cardiovascular"],
  "brief-2026-04-02-relation-family-1":    ["low birth rate community neighborhood family bond", "declining birthrate neighborhood social ties"],
};

const BLOCKED_TERMS = [
  "smoking", "cigarette", "cigarettes", "tobacco", "nicotine",
  "ashtray", "vape", "vaping", "cigar", "beer", "alcohol",
  "wine", "whiskey", "vodka"
];

function sanitize(text, limit = 120) {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
}

async function searchPixabay(query) {
  if (!env.PIXABAY_API_KEY) return null;
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", env.PIXABAY_API_KEY.trim());
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "10");

  const response = await fetch(url.toString(), { headers: { "user-agent": "sejulachim-thumbnail/1.0" } });
  if (!response.ok) return null;

  const data = await response.json();
  const hit = data.hits?.find((entry) => {
    if (!entry.largeImageURL && !entry.webformatURL) return false;
    const haystack = `${entry.tags ?? ""} ${entry.pageURL ?? ""}`.toLowerCase();
    return !BLOCKED_TERMS.some((term) => haystack.includes(term));
  });
  if (!hit) return null;

  return {
    url: hit.webformatURL || hit.largeImageURL,
    alt: sanitize(hit.tags || query, 160),
    pageUrl: hit.pageURL || "",
    author: sanitize(hit.user || "", 80) || null
  };
}

async function searchWikimediaCommons(query) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "8");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|extmetadata");
  url.searchParams.set("iiurlwidth", "1200");

  const response = await fetch(url.toString(), { headers: { "user-agent": "sejulachim-thumbnail/1.0" } });
  if (!response.ok) return null;

  const data = await response.json();
  const pages = Object.values(data.query?.pages ?? {});

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl) continue;
    const mime = String(info.mime ?? "").toLowerCase();
    if (!mime.startsWith("image/") || mime.includes("svg") || mime.includes("tiff")) continue;

    return {
      url: info.thumburl,
      alt: sanitize(page.title || query, 160),
      pageUrl: info.descriptionurl,
      author: null
    };
  }
  return null;
}

async function findThumbnail(slug) {
  const queries = SLUG_QUERIES[slug] ?? [];
  for (const q of queries) {
    const result = (await searchPixabay(q)) || (await searchWikimediaCommons(q));
    if (result) return { result, query: q };
  }
  return null;
}

async function main() {
  const slugArg = process.argv.find((a) => a.startsWith("--slug="))?.slice(7);

  const { data: items, error } = await supabase
    .from("content_items")
    .select("id, slug, title, category, sub_interest, thumbnail_url")
    .order("published_at", { ascending: false });

  if (error) throw error;

  let targets = items ?? [];
  if (slugArg) {
    targets = targets.filter((item) => item.slug === slugArg);
  } else {
    // 쿼리 맵에 있는 것만 업데이트
    targets = targets.filter((item) => SLUG_QUERIES[item.slug]);
  }

  console.log(`\n대상: ${targets.length}개\n`);

  let updated = 0;
  let skipped = 0;

  for (const item of targets) {
    const found = await findThumbnail(item.slug);
    if (!found) {
      console.warn(`[skip] ${item.slug} — 이미지 없음`);
      skipped++;
      continue;
    }

    const { result, query } = found;
    const { error: updateError } = await supabase.from("content_items").update({
      thumbnail_url: result.url,
      thumbnail_alt: result.alt || item.title,
      thumbnail_page_url: result.pageUrl,
      thumbnail_author: result.author,
      thumbnail_license: null,
      updated_at: new Date().toISOString()
    }).eq("id", item.id);

    if (updateError) {
      console.error(`[error] ${item.slug}:`, updateError.message);
      continue;
    }

    console.log(`[ok] ${item.slug} — "${query}"`);
    updated++;

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n완료: ${updated}개 업데이트, ${skipped}개 스킵`);
}

main().catch((e) => { console.error(e); process.exit(1); });
