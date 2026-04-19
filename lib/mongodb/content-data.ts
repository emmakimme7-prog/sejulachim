import "server-only";

import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { createClient } from "@supabase/supabase-js";

import { findRelatedContentThumbnail, type ContentThumbnail } from "@/lib/content/thumbnails";
import { DEMO_ARCHIVE_ITEMS } from "@/lib/content/demo-data";
import { getDisplayMainInterest, getStoredCategoryForMainInterest } from "@/lib/content/sub-interests";
import { hasSupabaseServerEnv } from "@/lib/env";
import { getMongoDb } from "@/lib/mongodb/client";
import { getSlmCollections } from "@/lib/mongodb/collections";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createSlug } from "@/lib/utils";

function objectIdOf(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

function getSupabaseClientIfAvailable() {
  try {
    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) {
      return null;
    }

    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (error) {
    console.error("[content-data] supabase unavailable", error);
    return null;
  }
}

export async function createManualContentItem(input: {
  title: string;
  category: string;
  subInterest?: string | null;
  thumbnailUrl?: string | null;
  thumbnailAlt?: string | null;
  thumbnailPageUrl?: string | null;
  thumbnailAuthor?: string | null;
  thumbnailLicense?: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceType?: "public" | "news" | "blog" | "other";
  rawText: string;
  summaryType: "MUST" | "USEFUL" | "ACTION";
}) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();

    await supabase.from("content_items").insert({
      title: input.title,
      category: getStoredCategoryForMainInterest(input.category),
      sub_interest: input.subInterest ?? null,
      long_summary: null,
      thumbnail_url: input.thumbnailUrl ?? null,
      thumbnail_alt: input.thumbnailAlt ?? null,
      thumbnail_page_url: input.thumbnailPageUrl ?? null,
      thumbnail_author: input.thumbnailAuthor ?? null,
      thumbnail_license: input.thumbnailLicense ?? null,
      source_name: input.sourceName,
      source_url: input.sourceUrl,
      sources: [
        {
          name: input.sourceName,
          url: input.sourceUrl,
          type: input.sourceType ?? "other"
        }
      ],
      raw_text: input.rawText,
      short_summary: null,
      action_line: null,
      summary_type: input.summaryType,
      approval_status: "pending",
      ai_status: "pending",
      ai_processing_started_at: null,
      published_at: null,
      slug: createSlug("brief"),
      created_at: now,
      updated_at: now
    });
    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const now = new Date().toISOString();

  await collections.contentItems.insertOne({
    title: input.title,
    category: getStoredCategoryForMainInterest(input.category),
    sub_interest: input.subInterest ?? null,
    long_summary: null,
    thumbnail_url: input.thumbnailUrl ?? null,
    thumbnail_alt: input.thumbnailAlt ?? null,
    thumbnail_page_url: input.thumbnailPageUrl ?? null,
    thumbnail_author: input.thumbnailAuthor ?? null,
    thumbnail_license: input.thumbnailLicense ?? null,
    source_name: input.sourceName,
    source_url: input.sourceUrl,
    sources: [
      {
        name: input.sourceName,
        url: input.sourceUrl,
        type: input.sourceType ?? "other"
      }
    ],
    raw_text: input.rawText,
    short_summary: null,
    action_line: null,
    summary_type: input.summaryType,
    approval_status: "pending",
    ai_status: "pending",
    ai_processing_started_at: null,
    published_at: null,
    slug: createSlug("brief"),
    created_at: now,
    updated_at: now
  });
}

export async function seedDemoContentItems() {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { count } = await supabase.from("content_items").select("*", { count: "exact", head: true });
    if ((count ?? 0) >= 5) {
      return;
    }

    const now = new Date().toISOString();
    const items = [
      {
        title: "걷기와 수면 리듬의 관계",
        category: "건강",
        sub_interest: "걷기",
        source_name: "세줄아침 데모",
        source_url: "https://example.com/health-walking",
        sources: [
          { name: "질병관리청", url: "https://example.com/health-public", type: "public" as const },
          { name: "세줄아침 데모", url: "https://example.com/health-walking", type: "blog" as const }
        ],
        raw_text: "가벼운 아침 걷기는 낮 동안 활동량을 높이고 밤 수면 리듬을 안정시키는 데 도움이 될 수 있다는 생활 건강 안내입니다.",
        short_summary: "아침에 잠깐 걷는 습관이 하루 컨디션과 수면 리듬을 함께 돕는다는 내용입니다.",
        long_summary:
          "아침에 가볍게 걷는 습관은 몸을 무리 없이 깨우고 하루 활동 리듬을 정돈하는 데 도움이 될 수 있습니다. 낮 동안 움직임이 조금만 늘어나도 저녁에 피로가 자연스럽게 쌓여 수면 흐름이 안정되는 데 보탬이 됩니다. 거창한 운동보다 부담 없이 이어갈 수 있는 짧은 걷기가 오히려 습관으로 남기 쉽습니다. 처음부터 오래 걸으려 하기보다 출근 전이나 집 근처에서 짧게 시작하는 방식이 더 현실적입니다.",
        action_line: "오늘은 집 앞을 20분 정도 천천히 걸어보세요.",
        summary_type: "ACTION" as const
      },
      {
        title: "식단 기록을 줄여도 패턴은 보입니다",
        category: "건강",
        sub_interest: "식단",
        source_name: "세줄아침 데모",
        source_url: "https://example.com/health-diet",
        sources: [
          { name: "국민건강보험공단", url: "https://example.com/health-diet-public", type: "public" as const },
          { name: "세줄아침 데모", url: "https://example.com/health-diet", type: "blog" as const }
        ],
        raw_text: "식사량과 시간만 간단히 적어두어도 생활 패턴을 읽는 데 도움이 될 수 있다는 건강 습관 안내입니다.",
        short_summary: "모든 식사를 자세히 적지 않아도 한 끼 기록만으로 흐름을 읽기 쉬워진다는 내용입니다.",
        long_summary:
          "식단을 기록할 때 모든 메뉴와 양을 완벽하게 적으려 하면 오래 이어가기 어렵습니다. 오히려 한 끼의 시간이나 대략적인 양만 간단히 남겨도 내 생활 패턴을 읽는 데 충분한 단서가 생깁니다. 특히 늦은 식사나 반복되는 간식 시간처럼 자주 놓치던 흐름을 확인하기 쉬워집니다. 기록의 정교함보다 꾸준히 남기는 리듬이 먼저라는 점을 보여주는 내용입니다.",
        action_line: "오늘은 한 끼만 시간과 양을 간단히 적어보세요.",
        summary_type: "USEFUL" as const
      },
      {
        title: "고정지출부터 보는 생활비 점검",
        category: "돈",
        sub_interest: "생활비",
        source_name: "세줄아침 데모",
        source_url: "https://example.com/money-cost",
        sources: [
          { name: "통계청", url: "https://example.com/money-public", type: "public" as const },
          { name: "세줄아침 데모", url: "https://example.com/money-cost", type: "news" as const }
        ],
        raw_text: "생활비를 줄이려면 변동지출보다 고정지출을 먼저 정리하는 것이 체감이 크다는 실용 정보입니다.",
        short_summary: "무조건 아끼기보다 매달 자동으로 빠지는 지출부터 보는 편이 더 효과적이라는 내용입니다.",
        long_summary:
          "생활비를 줄이고 싶을 때 매번 커피값이나 군것질만 줄이려 하면 금방 지치기 쉽습니다. 반면 매달 자동으로 빠져나가는 고정지출을 먼저 점검하면 한 번의 정리만으로도 체감이 크게 달라질 수 있습니다. 자주 보지 않는 구독료나 오래된 요금제처럼 습관처럼 유지되는 항목이 생각보다 많기 때문입니다. 생활비를 다잡는 첫 단계는 무조건 참는 일이 아니라 돈의 흐름을 먼저 보이는 데 있습니다.",
        action_line: "오늘 통장 자동이체 목록을 한 번만 적어보세요.",
        summary_type: "USEFUL" as const
      },
      {
        title: "절세 서류는 한곳에 모을수록 편합니다",
        category: "돈",
        sub_interest: "절세",
        source_name: "세줄아침 데모",
        source_url: "https://example.com/money-tax",
        sources: [
          { name: "국세청", url: "https://example.com/money-tax-public", type: "public" as const },
          { name: "세줄아침 데모", url: "https://example.com/money-tax", type: "news" as const }
        ],
        raw_text: "세금 관련 서류를 한곳에 모아두면 신고 시기마다 찾는 시간을 줄일 수 있다는 생활형 재무 안내입니다.",
        short_summary: "절세는 정보보다 서류 정리가 먼저라는 점을 다시 짚어주는 내용입니다.",
        long_summary:
          "절세 정보는 많지만 실제로 도움이 되는 순간은 필요한 서류를 제때 찾을 수 있을 때입니다. 영수증과 납부 확인서, 관련 안내문을 한곳에 모아두면 신고 시기마다 기억을 더듬는 시간을 줄일 수 있습니다. 정보 자체보다 정리 체계가 먼저 갖춰져야 챙길 수 있는 항목도 놓치지 않게 됩니다. 결국 절세 준비는 복잡한 계산보다 문서를 쉽게 꺼낼 수 있는 상태를 만드는 일에 가깝습니다.",
        action_line: "오늘은 세금 관련 문서를 한 폴더에만 모아보세요.",
        summary_type: "ACTION" as const
      },
      {
        title: "지역 병원 운영시간 확인",
        category: "뉴스",
        sub_interest: "지역 소식",
        source_name: "세줄아침 데모",
        source_url: "https://example.com/news-local",
        sources: [
          { name: "지자체 공지", url: "https://example.com/news-public", type: "public" as const },
          { name: "세줄아침 데모", url: "https://example.com/news-local", type: "news" as const }
        ],
        raw_text: "일부 지역 공공시설과 병원의 운영 시간이 조정되어 방문 전 확인이 필요하다는 지역 안내입니다.",
        short_summary: "오늘 꼭 가야 할 곳이 있다면 운영 시간이 달라졌는지 먼저 확인하는 편이 좋겠습니다.",
        long_summary:
          "지역 소식은 큰 이슈보다 생활 동선에 바로 닿는 운영 정보가 더 중요할 때가 많습니다. 공공시설이나 병원 운영 시간이 바뀌면 헛걸음을 하거나 일정이 꼬일 수 있어 방문 전 확인이 필요합니다. 특히 평소 익숙한 장소일수록 예전 시간표를 그대로 떠올리기 쉬워 더 놓치기 쉽습니다. 짧은 확인 한 번이 이동 시간과 불필요한 기다림을 줄여주는 가장 쉬운 대비가 됩니다.",
        action_line: "방문 전 전화나 홈페이지로 시간을 먼저 확인해보세요.",
        summary_type: "MUST" as const
      }
    ];

    await supabase.from("content_items").insert(
      items.map((item, index) => ({
        ...item,
        approval_status: "approved" as const,
        ai_status: "completed" as const,
        ai_processing_started_at: null,
        summary_status: "done" as const,
        published_at: now,
        slug: createSlug(`brief-${index + 1}`),
        created_at: now,
        updated_at: now
      }))
    );

    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const existing = await collections.contentItems.countDocuments();
  if (existing >= 5) {
    return;
  }

  const now = new Date().toISOString();
  const items = [
    {
      title: "걷기와 수면 리듬의 관계",
      category: "건강",
      sub_interest: "걷기",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/health-walking",
      sources: [
        { name: "질병관리청", url: "https://example.com/health-public", type: "public" as const },
        { name: "세줄아침 데모", url: "https://example.com/health-walking", type: "blog" as const }
      ],
      raw_text: "가벼운 아침 걷기는 낮 동안 활동량을 높이고 밤 수면 리듬을 안정시키는 데 도움이 될 수 있다는 생활 건강 안내입니다.",
      short_summary: "아침에 잠깐 걷는 습관이 하루 컨디션과 수면 리듬을 함께 돕는다는 내용입니다.",
      long_summary:
        "아침에 가볍게 걷는 습관은 몸을 무리 없이 깨우고 하루 활동 리듬을 정돈하는 데 도움이 될 수 있습니다. 낮 동안 움직임이 조금만 늘어나도 저녁에 피로가 자연스럽게 쌓여 수면 흐름이 안정되는 데 보탬이 됩니다. 거창한 운동보다 부담 없이 이어갈 수 있는 짧은 걷기가 오히려 습관으로 남기 쉽습니다. 처음부터 오래 걸으려 하기보다 출근 전이나 집 근처에서 짧게 시작하는 방식이 더 현실적입니다.",
      action_line: "오늘은 집 앞을 20분 정도 천천히 걸어보세요.",
      summary_type: "ACTION" as const
    },
    {
      title: "식단 기록을 줄여도 패턴은 보입니다",
      category: "건강",
      sub_interest: "식단",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/health-diet",
      sources: [
        { name: "국민건강보험공단", url: "https://example.com/health-diet-public", type: "public" as const },
        { name: "세줄아침 데모", url: "https://example.com/health-diet", type: "blog" as const }
      ],
      raw_text: "식사량과 시간만 간단히 적어두어도 생활 패턴을 읽는 데 도움이 될 수 있다는 건강 습관 안내입니다.",
      short_summary: "모든 식사를 자세히 적지 않아도 한 끼 기록만으로 흐름을 읽기 쉬워진다는 내용입니다.",
      long_summary:
        "식단을 기록할 때 모든 메뉴와 양을 완벽하게 적으려 하면 오래 이어가기 어렵습니다. 오히려 한 끼의 시간이나 대략적인 양만 간단히 남겨도 내 생활 패턴을 읽는 데 충분한 단서가 생깁니다. 특히 늦은 식사나 반복되는 간식 시간처럼 자주 놓치던 흐름을 확인하기 쉬워집니다. 기록의 정교함보다 꾸준히 남기는 리듬이 먼저라는 점을 보여주는 내용입니다.",
      action_line: "오늘은 한 끼만 시간과 양을 간단히 적어보세요.",
      summary_type: "USEFUL" as const
    },
    {
      title: "고정지출부터 보는 생활비 점검",
      category: "돈",
      sub_interest: "생활비",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/money-cost",
      sources: [
        { name: "통계청", url: "https://example.com/money-public", type: "public" as const },
        { name: "세줄아침 데모", url: "https://example.com/money-cost", type: "news" as const }
      ],
      raw_text: "생활비를 줄이려면 변동지출보다 고정지출을 먼저 정리하는 것이 체감이 크다는 실용 정보입니다.",
      short_summary: "무조건 아끼기보다 매달 자동으로 빠지는 지출부터 보는 편이 더 효과적이라는 내용입니다.",
      long_summary:
        "생활비를 줄이고 싶을 때 매번 커피값이나 군것질만 줄이려 하면 금방 지치기 쉽습니다. 반면 매달 자동으로 빠져나가는 고정지출을 먼저 점검하면 한 번의 정리만으로도 체감이 크게 달라질 수 있습니다. 자주 보지 않는 구독료나 오래된 요금제처럼 습관처럼 유지되는 항목이 생각보다 많기 때문입니다. 생활비를 다잡는 첫 단계는 무조건 참는 일이 아니라 돈의 흐름을 먼저 보이는 데 있습니다.",
      action_line: "오늘 통장 자동이체 목록을 한 번만 적어보세요.",
      summary_type: "USEFUL" as const
    },
    {
      title: "절세 서류는 한곳에 모을수록 편합니다",
      category: "돈",
      sub_interest: "절세",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/money-tax",
      sources: [
        { name: "국세청", url: "https://example.com/money-tax-public", type: "public" as const },
        { name: "세줄아침 데모", url: "https://example.com/money-tax", type: "news" as const }
      ],
      raw_text: "세금 관련 서류를 한곳에 모아두면 신고 시기마다 찾는 시간을 줄일 수 있다는 생활형 재무 안내입니다.",
      short_summary: "절세는 정보보다 서류 정리가 먼저라는 점을 다시 짚어주는 내용입니다.",
      long_summary:
        "절세 정보는 많지만 실제로 도움이 되는 순간은 필요한 서류를 제때 찾을 수 있을 때입니다. 영수증과 납부 확인서, 관련 안내문을 한곳에 모아두면 신고 시기마다 기억을 더듬는 시간을 줄일 수 있습니다. 정보 자체보다 정리 체계가 먼저 갖춰져야 챙길 수 있는 항목도 놓치지 않게 됩니다. 결국 절세 준비는 복잡한 계산보다 문서를 쉽게 꺼낼 수 있는 상태를 만드는 일에 가깝습니다.",
      action_line: "오늘은 세금 관련 문서를 한 폴더에만 모아보세요.",
      summary_type: "ACTION" as const
    },
    {
      title: "지역 병원 운영시간 확인",
      category: "뉴스",
      sub_interest: "지역 소식",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/news-local",
      sources: [
        { name: "지자체 공지", url: "https://example.com/news-public", type: "public" as const },
        { name: "세줄아침 데모", url: "https://example.com/news-local", type: "news" as const }
      ],
      raw_text: "일부 지역 공공시설과 병원의 운영 시간이 조정되어 방문 전 확인이 필요하다는 지역 안내입니다.",
      short_summary: "오늘 꼭 가야 할 곳이 있다면 운영 시간이 달라졌는지 먼저 확인하는 편이 좋겠습니다.",
      long_summary:
        "지역 소식은 큰 이슈보다 생활 동선에 바로 닿는 운영 정보가 더 중요할 때가 많습니다. 공공시설이나 병원 운영 시간이 바뀌면 헛걸음을 하거나 일정이 꼬일 수 있어 방문 전 확인이 필요합니다. 특히 평소 익숙한 장소일수록 예전 시간표를 그대로 떠올리기 쉬워 더 놓치기 쉽습니다. 짧은 확인 한 번이 이동 시간과 불필요한 기다림을 줄여주는 가장 쉬운 대비가 됩니다.",
      action_line: "방문 전 전화나 홈페이지로 시간을 먼저 확인해보세요.",
      summary_type: "MUST" as const
    },
    {
      title: "국제 이슈는 환율과 기름값부터 보세요",
      category: "뉴스",
      sub_interest: "국제이슈",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/news-global",
      sources: [
        { name: "한국은행", url: "https://example.com/news-global-public", type: "public" as const },
        { name: "세줄아침 데모", url: "https://example.com/news-global", type: "news" as const }
      ],
      raw_text: "국제 뉴스가 많을 때는 환율과 유가처럼 생활비와 연결되는 숫자를 먼저 보면 도움이 된다는 안내입니다.",
      short_summary: "먼 나라 뉴스도 생활비와 닿는 값부터 보면 더 쉽게 이해할 수 있다는 내용입니다.",
      long_summary:
        "국제 뉴스는 내용이 크고 복잡해 보여도 생활과 연결되는 숫자부터 보면 훨씬 이해하기 쉬워집니다. 환율이나 유가처럼 바로 체감되는 지표는 장보기와 교통비, 여행 비용까지 넓게 영향을 줄 수 있습니다. 사건의 전체 맥락을 모두 따라가기 어렵더라도 생활비와 닿는 부분을 먼저 보면 뉴스의 무게를 가늠하기 수월해집니다. 멀게 느껴지는 이슈를 내 일상 언어로 바꿔 읽는 방법을 제안하는 내용입니다.",
      action_line: "오늘은 국제 뉴스보다 환율이나 유가 한 줄만 확인해보세요.",
      summary_type: "MUST" as const
    },
    {
      title: "봄나들이 이동 팁",
      category: "취미",
      sub_interest: "여행",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/hobby-trip",
      sources: [
        { name: "여행 블로그", url: "https://example.com/hobby-blog", type: "blog" as const },
        { name: "세줄아침 데모", url: "https://example.com/hobby-trip", type: "other" as const }
      ],
      raw_text: "봄철 가까운 나들이 장소는 주말 교통 혼잡이 잦아 대중교통 이동이 더 편할 수 있다는 여행 팁입니다.",
      short_summary: "가볍게 다녀올 여행은 이동 시간을 먼저 따져보면 훨씬 편해질 수 있습니다.",
      long_summary:
        "가까운 봄나들이는 목적지보다 이동 과정에서 피로가 커지는 경우가 많습니다. 주말에는 짧은 거리도 차량이 몰리기 쉬워 예상보다 훨씬 오래 걸릴 수 있습니다. 그래서 장소를 고를 때 풍경이나 맛집 정보만 보지 말고 이동 시간과 교통 수단을 먼저 확인하는 편이 더 실용적입니다. 짧은 외출일수록 현장 체류 시간보다 이동 효율이 만족도를 좌우한다는 점을 짚어줍니다.",
      action_line: "이번 주말 가고 싶은 곳의 버스나 지하철 시간을 먼저 살펴보세요.",
      summary_type: "USEFUL" as const
    },
    {
      title: "사진 한 장 남기면 하루가 또렷해집니다",
      category: "취미",
      sub_interest: "사진",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/hobby-photo",
      sources: [
        { name: "생활정보 블로그", url: "https://example.com/hobby-photo-blog", type: "blog" as const },
        { name: "세줄아침 데모", url: "https://example.com/hobby-photo", type: "other" as const }
      ],
      raw_text: "하루에 사진 한 장만 남겨도 감정과 기억을 정리하는 데 도움이 된다는 취미 습관 안내입니다.",
      short_summary: "짧은 기록이 어려운 날에도 사진 한 장이면 충분하다는 내용입니다.",
      long_summary:
        "기록 습관은 거창하게 시작할수록 오래 이어가기 어렵습니다. 반면 하루에 사진 한 장만 남기는 방식은 부담이 적어 자연스럽게 일상의 결을 붙잡아 줍니다. 글을 길게 쓰지 못하는 날에도 장면 하나를 남기면 그날의 기분이나 흐름을 다시 떠올리기 쉬워집니다. 작은 이미지 기록이 쌓이면서 하루를 돌아보는 감각도 조금씩 또렷해질 수 있다는 내용입니다.",
      action_line: "오늘 마음에 든 장면을 한 장만 찍어두세요.",
      summary_type: "ACTION" as const
    },
    {
      title: "가족 일정 정리의 기준",
      category: "가족",
      sub_interest: "집안 일정",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/family-calendar",
      sources: [
        { name: "생활정보 블로그", url: "https://example.com/family-blog", type: "blog" as const },
        { name: "세줄아침 데모", url: "https://example.com/family-calendar", type: "other" as const }
      ],
      raw_text: "가족 약속과 병원 일정, 학교 일정을 한 화면에 적어두면 서로 놓치는 일이 줄어든다는 생활 정보입니다.",
      short_summary: "여러 사람 일정을 따로 기억하기보다 같이 보는 일정판이 더 실용적이라는 내용입니다.",
      long_summary:
        "가족 일정은 각자 머릿속에 따로 담아둘수록 빠뜨리는 일이 늘어나기 쉽습니다. 병원 예약과 학교 행사, 집안 약속을 한 화면에 함께 두면 누가 봐도 바로 흐름을 이해할 수 있어 조율이 쉬워집니다. 특히 반복되는 일상 속에서는 전달보다 확인이 더 중요해지는데, 공용 일정판은 그 확인 비용을 크게 줄여줍니다. 집안의 작은 혼선을 줄이는 방법은 복잡한 도구보다 모두가 볼 수 있는 한 장의 정리일 수 있습니다.",
      action_line: "냉장고나 메모판에 이번 주 일정을 한 번에 적어보세요.",
      summary_type: "ACTION" as const
    },
    {
      title: "자녀와의 짧은 대화도 기록이 됩니다",
      category: "가족",
      sub_interest: "자녀 소통",
      source_name: "세줄아침 데모",
      source_url: "https://example.com/family-talk",
      sources: [
        { name: "생활정보 블로그", url: "https://example.com/family-talk-blog", type: "blog" as const },
        { name: "세줄아침 데모", url: "https://example.com/family-talk", type: "other" as const }
      ],
      raw_text: "짧은 안부나 한두 문장 대화만으로도 가족 관계의 흐름을 이어가는 데 도움이 된다는 생활 정보입니다.",
      short_summary: "긴 대화보다 꾸준한 짧은 대화가 더 실용적일 수 있다는 내용입니다.",
      long_summary:
        "가족과의 대화는 꼭 길어야 의미가 생기는 것은 아닙니다. 바쁜 날에는 한두 문장 안부만으로도 서로의 상태를 확인하고 관계의 흐름을 이어갈 수 있습니다. 오히려 짧더라도 자주 건네는 질문이 더 자연스럽고 부담이 적어 꾸준히 이어지기 쉽습니다. 대화를 잘해야 한다는 부담보다 작은 관심을 반복하는 편이 더 현실적인 방법일 수 있다는 내용을 전합니다.",
      action_line: "오늘은 자녀에게 하루 어땠는지 한 가지만 물어보세요.",
      summary_type: "USEFUL" as const
    }
  ];

  await collections.contentItems.insertMany(
    items.map((item, index) => ({
      ...item,
      approval_status: "approved" as const,
      ai_status: "completed" as const,
      ai_processing_started_at: null,
      summary_status: "done" as const,
      published_at: now,
      slug: createSlug(`brief-${index + 1}`),
      created_at: now,
      updated_at: now
    }))
  );
}

export async function listDashboardContentItems() {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from("content_items").select("*").order("created_at", { ascending: false }).limit(50);
    return data ?? [];
  }

  const db = await getMongoDb();
  return getSlmCollections(db).contentItems.find({}).sort({ created_at: -1 }).limit(50).toArray();
}

export async function setContentApprovalStatus(id: string, status: "approved" | "rejected") {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    await supabase
      .from("content_items")
      .update({
        approval_status: status,
        published_at: status === "approved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
    return;
  }

  const db = await getMongoDb();
  const objectId = objectIdOf(id);
  if (!objectId) {
    throw new Error("INVALID_CONTENT_ID");
  }

  await getSlmCollections(db).contentItems.updateOne(
    { _id: objectId },
    {
      $set: {
        approval_status: status,
        published_at: status === "approved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }
    }
  );
}

export async function claimPendingContentForAi(id: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("content_items")
      .update({
        ai_processing_started_at: now,
        updated_at: now
      })
      .eq("id", id)
      .eq("ai_status", "pending")
      .select("*")
      .maybeSingle();

    return data;
  }

  const db = await getMongoDb();
  const objectId = objectIdOf(id);
  if (!objectId) {
    throw new Error("INVALID_CONTENT_ID");
  }

  const result = await getSlmCollections(db).contentItems.findOneAndUpdate(
    {
      _id: objectId,
      ai_status: "pending"
    },
    {
      $set: {
        ai_processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    },
    {
      returnDocument: "after"
    }
  );

  return result;
}

export async function getContentItemById(id: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from("content_items").select("*").eq("id", id).maybeSingle();
    return data;
  }

  const db = await getMongoDb();
  const objectId = objectIdOf(id);
  if (!objectId) {
    return null;
  }

  return getSlmCollections(db).contentItems.findOne({ _id: objectId });
}

export async function markContentAiCompleted(
  id: string,
  input: {
    title: string;
    shortSummary: string;
    longSummary: string;
    actionLine: string;
    summaryType: "MUST" | "USEFUL" | "ACTION";
    thumbnail?: ContentThumbnail | null;
  }
) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    await supabase
      .from("content_items")
      .update({
        title: input.title,
        short_summary: input.shortSummary,
        long_summary: input.longSummary,
        action_line: input.actionLine,
        summary_type: input.summaryType,
        thumbnail_url: input.thumbnail?.url ?? null,
        thumbnail_alt: input.thumbnail?.alt ?? null,
        thumbnail_page_url: input.thumbnail?.pageUrl ?? null,
        thumbnail_author: input.thumbnail?.author ?? null,
        thumbnail_license: input.thumbnail?.license ?? null,
        ai_status: "completed",
        ai_processing_started_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
    return;
  }

  const db = await getMongoDb();
  const objectId = objectIdOf(id);
  if (!objectId) {
    throw new Error("INVALID_CONTENT_ID");
  }

  await getSlmCollections(db).contentItems.updateOne(
    { _id: objectId },
    {
      $set: {
        title: input.title,
        short_summary: input.shortSummary,
        long_summary: input.longSummary,
        action_line: input.actionLine,
        summary_type: input.summaryType,
        thumbnail_url: input.thumbnail?.url ?? null,
        thumbnail_alt: input.thumbnail?.alt ?? null,
        thumbnail_page_url: input.thumbnail?.pageUrl ?? null,
        thumbnail_author: input.thumbnail?.author ?? null,
        thumbnail_license: input.thumbnail?.license ?? null,
        ai_status: "completed",
        ai_processing_started_at: null,
        updated_at: new Date().toISOString()
      }
    }
  );
}

export async function markContentAiFailed(id: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    await supabase
      .from("content_items")
      .update({
        ai_status: "failed",
        ai_processing_started_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
    return;
  }

  const db = await getMongoDb();
  const objectId = objectIdOf(id);
  if (!objectId) {
    return;
  }

  await getSlmCollections(db).contentItems.updateOne(
    { _id: objectId },
    {
      $set: {
        ai_status: "failed",
        ai_processing_started_at: null,
        updated_at: new Date().toISOString()
      }
    }
  );
}

export async function listArchiveContentItems() {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .eq("approval_status", "approved")
      .eq("ai_status", "completed")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(30);
    return data ?? [];
  }

  const db = await getMongoDb();
  return getSlmCollections(db)
    .contentItems.find({
      approval_status: "approved",
      ai_status: "completed",
      published_at: { $ne: null }
    })
    .sort({ published_at: -1 })
    .limit(30)
    .toArray();
}

export async function listUserFavoriteContentItems(userId: string) {
  const supabase = getSupabaseClientIfAvailable();
  if (supabase) {
    const { data: favorites } = await supabase.from("favorites").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    const archiveItems = await listArchiveContentItems();
    const contentIds = (favorites ?? []).map((item) => item.content_item_id).filter((value): value is string => Boolean(value));
    const { data: contentItems } =
      contentIds.length > 0 ? await supabase.from("content_items").select("*").in("id", contentIds) : { data: [] as Record<string, unknown>[] };

    const itemMap = new Map((contentItems ?? []).map((item) => [String(item.id), item]));
    const archiveBySlug = new Map(
      [...archiveItems, ...DEMO_ARCHIVE_ITEMS].map((item) => [
        item.slug,
        {
          id: "id" in item ? String(item.id) : item._id?.toString() ?? item.slug,
          slug: item.slug,
          title: item.title,
          short_summary: item.short_summary ?? "",
          action_line: "action_line" in item ? (item.action_line as string | null) ?? null : null,
          sources: item.sources ?? [],
          published_at: item.published_at,
          category: getDisplayMainInterest("category" in item ? item.category : item.main_interest, item.sub_interest ?? null),
          sub_interest: item.sub_interest ?? null,
          thumbnail_url: "thumbnail_url" in item ? (item.thumbnail_url as string | null) ?? null : null
        }
      ])
    );
    const demoById = new Map(DEMO_ARCHIVE_ITEMS.map((item) => [item.id, item]));

    return (favorites ?? [])
      .map((favorite) => {
        const archiveContent = favorite.content_slug ? archiveBySlug.get(favorite.content_slug) : null;
        if (archiveContent) {
          return {
            ...archiveContent,
            favorite_created_at: favorite.created_at
          };
        }

        const demoContent = favorite.content_item_id ? demoById.get(favorite.content_item_id) : null;
        if (demoContent) {
          return {
            id: demoContent.id,
            slug: demoContent.slug,
            title: demoContent.title,
            short_summary: demoContent.short_summary,
            sources: demoContent.sources ?? [],
            published_at: demoContent.published_at,
            category: getDisplayMainInterest(demoContent.main_interest, demoContent.sub_interest ?? null),
            sub_interest: demoContent.sub_interest ?? null,
            favorite_created_at: favorite.created_at
          };
        }

        const content = favorite.content_item_id ? itemMap.get(favorite.content_item_id) : null;
        if (!content) {
          return null;
        }

        return {
          id: String(content.id),
          favorite_created_at: favorite.created_at,
          ...content,
          category: getDisplayMainInterest(typeof content.category === "string" ? content.category : null, typeof content.sub_interest === "string" ? content.sub_interest : null)
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const favorites = await collections.favorites.find({ user_id: userId }).sort({ created_at: -1 }).toArray();
  const objectIds = favorites
    .map((item) => objectIdOf(item.content_item_id ?? ""))
    .filter((item): item is ObjectId => Boolean(item));

  const [items, archiveItems] = await Promise.all([
    objectIds.length > 0 ? collections.contentItems.find({ _id: { $in: objectIds } }).toArray() : Promise.resolve([]),
    listArchiveContentItems()
  ]);
  const itemMap = new Map(items.map((item) => [item._id?.toString(), item]));
  const archiveBySlug = new Map(
    [...archiveItems, ...DEMO_ARCHIVE_ITEMS].map((item) => [
      item.slug,
      {
        id: "id" in item ? item.id : item._id?.toString() ?? item.slug,
        slug: item.slug,
        title: item.title,
        short_summary: item.short_summary ?? "",
        action_line: "action_line" in item ? (item.action_line as string | null) ?? null : null,
        sources: item.sources ?? [],
        published_at: item.published_at,
        category: getDisplayMainInterest("category" in item ? item.category : item.main_interest, item.sub_interest ?? null),
        sub_interest: item.sub_interest ?? null,
        thumbnail_url: "thumbnail_url" in item ? (item.thumbnail_url as string | null) ?? null : null
      }
    ])
  );
  const demoById = new Map(DEMO_ARCHIVE_ITEMS.map((item) => [item.id, item]));

  return favorites
    .map((favorite) => {
      const archiveContent = favorite.content_slug ? archiveBySlug.get(favorite.content_slug) : null;
      if (archiveContent) {
        return {
          ...archiveContent,
          favorite_created_at: favorite.created_at
        };
      }

      const demoContent = favorite.content_item_id ? demoById.get(favorite.content_item_id) : null;
      if (demoContent) {
        return {
          id: demoContent.id,
          slug: demoContent.slug,
          title: demoContent.title,
          short_summary: demoContent.short_summary,
          sources: demoContent.sources ?? [],
          published_at: demoContent.published_at,
          category: getDisplayMainInterest(demoContent.main_interest, demoContent.sub_interest ?? null),
          sub_interest: demoContent.sub_interest ?? null,
          favorite_created_at: favorite.created_at
        };
      }

      const content = favorite.content_item_id ? itemMap.get(favorite.content_item_id) : null;
      if (!content?._id) {
        return null;
      }
      return {
        id: content._id.toString(),
        favorite_created_at: favorite.created_at,
        ...content,
        category: getDisplayMainInterest(content.category, content.sub_interest ?? null)
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function listUserFavoriteContentSlugs(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data: favorites } = await supabase.from("favorites").select("*").eq("user_id", userId);
    const demoById = new Map(DEMO_ARCHIVE_ITEMS.map((item) => [item.id, item.slug]));

    return (favorites ?? [])
      .map((item) => item.content_slug ?? (item.content_item_id ? demoById.get(item.content_item_id) : null))
      .filter((item): item is string => Boolean(item));
  }

  const db = await getMongoDb();
  const favorites = await getSlmCollections(db).favorites.find({ user_id: userId }).toArray();
  const demoById = new Map(DEMO_ARCHIVE_ITEMS.map((item) => [item.id, item.slug]));

  return favorites
    .map((item) => item.content_slug ?? (item.content_item_id ? demoById.get(item.content_item_id) : null))
    .filter((item): item is string => Boolean(item));
}

export async function toggleFavoriteContentItem(
  userId: string,
  input: {
    contentItemId?: string;
    slug: string;
  }
) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data: favorites, error: favoritesError } = await supabase.from("favorites").select("*").eq("user_id", userId);
    if (favoritesError) {
      throw favoritesError;
    }

    const existing = (favorites ?? []).find(
      (item) => item.content_slug === input.slug || (input.contentItemId ? item.content_item_id === input.contentItemId : false)
    );

    if (existing) {
      const { error: deleteError } = await supabase.from("favorites").delete().eq("id", existing.id);
      if (deleteError) {
        throw deleteError;
      }
      return { isFavorite: false };
    }

    const { error: insertError } = await supabase.from("favorites").insert({
      user_id: userId,
      content_item_id: input.contentItemId ?? null,
      content_slug: input.slug,
      created_at: new Date().toISOString()
    });
    if (insertError) {
      throw insertError;
    }

    return { isFavorite: true };
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const existing = await collections.favorites.findOne({
    user_id: userId,
    $or: [{ content_slug: input.slug }, ...(input.contentItemId ? [{ content_item_id: input.contentItemId }] : [])]
  });

  if (existing?._id) {
    await collections.favorites.deleteOne({ _id: existing._id });
    return { isFavorite: false };
  }

  await collections.favorites.insertOne({
    user_id: userId,
    content_item_id: input.contentItemId ?? null,
    content_slug: input.slug,
    created_at: new Date().toISOString()
  });

  return { isFavorite: true };
}

export async function createSharedLinkRecord(input: {
  userId: string;
  slugs: string[];
  nickname?: string | null;
  avatarKey?: string | null;
  message?: string | null;
  shareKey?: string | null;
}) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const nextMessage = input.message?.trim() ? input.message.trim().slice(0, 50) : null;

    if (input.shareKey) {
      await supabase
        .from("shared_links")
        .update({
          slugs: input.slugs.slice(0, 10),
          nickname: input.nickname ?? null,
          avatar_key: input.avatarKey ?? null,
          message: nextMessage,
          updated_at: now
        })
        .eq("share_key", input.shareKey)
        .eq("user_id", input.userId);

      return input.shareKey;
    }

    const shareKey = randomBytes(10).toString("hex");
    await supabase.from("shared_links").insert({
      user_id: input.userId,
      share_key: shareKey,
      slugs: input.slugs.slice(0, 10),
      nickname: input.nickname ?? null,
      avatar_key: input.avatarKey ?? null,
      message: nextMessage,
      view_count: 0,
      created_at: now,
      updated_at: now,
      last_viewed_at: null
    });

    return shareKey;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const now = new Date().toISOString();
  const nextMessage = input.message?.trim() ? input.message.trim().slice(0, 50) : null;

  if (input.shareKey) {
    await collections.sharedLinks.updateOne(
      { share_key: input.shareKey, user_id: input.userId },
      {
        $set: {
          slugs: input.slugs.slice(0, 10),
          nickname: input.nickname ?? null,
          avatar_key: input.avatarKey ?? null,
          message: nextMessage,
          updated_at: now
        }
      }
    );

    return input.shareKey;
  }

  const shareKey = randomBytes(10).toString("hex");

  await collections.sharedLinks.insertOne({
    user_id: input.userId,
    share_key: shareKey,
    slugs: input.slugs.slice(0, 10),
    nickname: input.nickname ?? null,
    avatar_key: input.avatarKey ?? null,
    message: nextMessage,
    view_count: 0,
    created_at: now,
    updated_at: now,
    last_viewed_at: null
  });

  return shareKey;
}

export async function getSharedLinkRecord(shareKey: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from("shared_links").select("*").eq("share_key", shareKey).maybeSingle();
    return data;
  }

  const db = await getMongoDb();
  return getSlmCollections(db).sharedLinks.findOne({ share_key: shareKey });
}

export async function incrementSharedLinkView(shareKey: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const { data } = await supabase.from("shared_links").select("view_count").eq("share_key", shareKey).maybeSingle();
    await supabase
      .from("shared_links")
      .update({
        view_count: Number(data?.view_count ?? 0) + 1,
        updated_at: now,
        last_viewed_at: now
      })
      .eq("share_key", shareKey);
    return;
  }

  const db = await getMongoDb();
  const now = new Date().toISOString();
  await getSlmCollections(db).sharedLinks.updateOne(
    { share_key: shareKey },
    {
      $inc: { view_count: 1 },
      $set: { updated_at: now, last_viewed_at: now }
    }
  );
}

export async function listUserSharedLinks(userId: string) {
  const supabase = getSupabaseClientIfAvailable();
  if (supabase) {
    const { data: links } = await supabase.from("shared_links").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    const shareKeys = (links ?? []).map((item) => item.share_key);
    const { data: comments } =
      shareKeys.length > 0 ? await supabase.from("shared_comments").select("share_key").in("share_key", shareKeys) : { data: [] as { share_key: string }[] };
    const countMap = new Map<string, number>();

    for (const comment of comments ?? []) {
      countMap.set(comment.share_key, (countMap.get(comment.share_key) ?? 0) + 1);
    }

    return (links ?? []).map((link) => ({
      ...link,
      comment_count: countMap.get(link.share_key) ?? 0
    }));
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const links = await collections.sharedLinks.find({ user_id: userId }).sort({ created_at: -1 }).toArray();
  const counts = await collections.sharedComments
    .aggregate<{ _id: string; count: number }>([
      { $match: { share_key: { $in: links.map((item) => item.share_key) } } },
      { $group: { _id: "$share_key", count: { $sum: 1 } } }
    ])
    .toArray();
  const countMap = new Map(counts.map((item) => [item._id, item.count]));

  return links.map((link) => ({
    ...link,
    comment_count: countMap.get(link.share_key) ?? 0
  }));
}

export async function listSharedComments(shareKey: string) {
  const supabase = getSupabaseClientIfAvailable();
  if (supabase) {
    const { data } = await supabase.from("shared_comments").select("*").eq("share_key", shareKey).order("created_at", { ascending: true });
    return data ?? [];
  }

  const db = await getMongoDb();
  return getSlmCollections(db).sharedComments.find({ share_key: shareKey }).sort({ created_at: 1 }).toArray();
}

export async function createSharedComment(input: {
  shareKey: string;
  userId?: string | null;
  parentId?: string | null;
  name: string;
  content: string;
}) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    let depth = 1;

    if (input.parentId) {
      const { data: parent } = await supabase
        .from("shared_comments")
        .select("*")
        .eq("id", input.parentId)
        .eq("share_key", input.shareKey)
        .maybeSingle();

      if (!parent) {
        throw new Error("PARENT_COMMENT_NOT_FOUND");
      }

      depth = (parent.depth ?? 1) + 1;
      if (depth > 3) {
        throw new Error("COMMENT_DEPTH_EXCEEDED");
      }
    }

    const document = {
      share_key: input.shareKey,
      user_id: input.userId ?? null,
      parent_id: input.parentId ?? null,
      depth,
      name: input.name.trim().slice(0, 30),
      content: input.content.trim().slice(0, 50),
      created_at: now
    };

    const { data, error } = await supabase.from("shared_comments").insert(document).select("*").single();
    if (error || !data) {
      throw new Error("COMMENT_CREATE_FAILED");
    }

    return {
      id: data.id,
      user_id: data.user_id,
      parent_id: data.parent_id,
      depth: data.depth,
      name: data.name,
      content: data.content,
      created_at: data.created_at
    };
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const now = new Date().toISOString();
  let depth = 1;

  if (input.parentId) {
    const parentObjectId = objectIdOf(input.parentId);
    if (!parentObjectId) {
      throw new Error("INVALID_PARENT_COMMENT");
    }
    const parent = await collections.sharedComments.findOne({ _id: parentObjectId, share_key: input.shareKey });
    if (!parent) {
      throw new Error("PARENT_COMMENT_NOT_FOUND");
    }
    depth = (parent.depth ?? 1) + 1;
    if (depth > 3) {
      throw new Error("COMMENT_DEPTH_EXCEEDED");
    }
  }

  const document = {
    share_key: input.shareKey,
    user_id: input.userId ?? null,
    parent_id: input.parentId ?? null,
    depth,
    name: input.name.trim().slice(0, 30),
    content: input.content.trim().slice(0, 50),
    created_at: now
  };

  const result = await collections.sharedComments.insertOne(document);

  return {
    id: result.insertedId.toString(),
    user_id: document.user_id,
    parent_id: document.parent_id,
    depth: document.depth,
    name: document.name,
    content: document.content,
    created_at: document.created_at
  };
}

export async function createNotification(input: {
  userId: string;
  actorName: string;
  title: string;
  body: string;
  targetUrl: string;
}) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    await supabase.from("notifications").insert({
      user_id: input.userId,
      type: "share_comment",
      actor_name: input.actorName.slice(0, 30),
      title: input.title,
      body: input.body,
      target_url: input.targetUrl,
      is_read: false,
      created_at: new Date().toISOString(),
      read_at: null
    });
    return;
  }

  const db = await getMongoDb();
  await getSlmCollections(db).notifications.insertOne({
    user_id: input.userId,
    type: "share_comment",
    actor_name: input.actorName.slice(0, 30),
    title: input.title,
    body: input.body,
    target_url: input.targetUrl,
    is_read: false,
    created_at: new Date().toISOString(),
    read_at: null
  });
}

export async function listUserNotifications(userId: string) {
  const supabase = getSupabaseClientIfAvailable();
  if (supabase) {
    const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    return data ?? [];
  }

  const db = await getMongoDb();
  return getSlmCollections(db).notifications.find({ user_id: userId }).sort({ created_at: -1 }).limit(50).toArray();
}

export async function countUnreadNotifications(userId: string) {
  const supabase = getSupabaseClientIfAvailable();
  if (supabase) {
    const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false);
    return count ?? 0;
  }

  const db = await getMongoDb();
  return getSlmCollections(db).notifications.countDocuments({ user_id: userId, is_read: false });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const supabase = getSupabaseClientIfAvailable();
  if (supabase) {
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);
    return;
  }

  const db = await getMongoDb();
  const objectId = objectIdOf(notificationId);
  if (!objectId) {
    return;
  }
  await getSlmCollections(db).notifications.updateOne(
    { _id: objectId, user_id: userId },
    { $set: { is_read: true, read_at: new Date().toISOString() } }
  );
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = getSupabaseClientIfAvailable();
  if (supabase) {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("user_id", userId).eq("is_read", false);
    return;
  }

  const db = await getMongoDb();
  await getSlmCollections(db).notifications.updateMany(
    { user_id: userId, is_read: false },
    { $set: { is_read: true, read_at: new Date().toISOString() } }
  );
}

export async function getArchiveContentItemBySlug(slug: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .eq("slug", slug)
      .eq("approval_status", "approved")
      .eq("ai_status", "completed")
      .maybeSingle();
    return data;
  }

  const db = await getMongoDb();
  return getSlmCollections(db).contentItems.findOne({
    slug,
    approval_status: "approved",
    ai_status: "completed"
  });
}

export async function backfillMissingContentThumbnails(limit = 20) {
  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const items = await collections.contentItems
    .find({
      approval_status: "approved",
      ai_status: "completed",
      published_at: { $ne: null },
      $or: [{ thumbnail_url: null }, { thumbnail_url: "" }, { thumbnail_url: { $exists: false } }]
    })
    .sort({ published_at: -1 })
    .limit(limit)
    .toArray();

  let updated = 0;
  const usedPageUrls = new Set<string>();

  for (const item of items) {
    if (!item._id) {
      continue;
    }

    const thumbnail = await findRelatedContentThumbnail({
      title: item.title,
      category: item.category,
      subInterest: item.sub_interest ?? null,
      excludePageUrls: usedPageUrls
    });

    if (!thumbnail) {
      continue;
    }
    if (thumbnail.pageUrl) usedPageUrls.add(thumbnail.pageUrl);

    await collections.contentItems.updateOne(
      { _id: item._id },
      {
        $set: {
          thumbnail_url: thumbnail.url,
          thumbnail_alt: thumbnail.alt,
          thumbnail_page_url: thumbnail.pageUrl,
          thumbnail_author: thumbnail.author ?? null,
          thumbnail_license: thumbnail.license ?? null,
          updated_at: new Date().toISOString()
        }
      }
    );
    updated += 1;
  }

  return { scanned: items.length, updated };
}

export async function getDashboardMetrics() {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const sevenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
    const [
      userCountResult,
      contentCountResult,
      latestEmailLogResult,
      recentUsersResult,
      recentSharesResult
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("content_items").select("*", { count: "exact", head: true }),
      supabase.from("email_logs").select("*").order("sent_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("users").select("created_at").gte("created_at", thirtyDaysAgo),
      supabase.from("job_logs").select("run_at").eq("job_name", "share.action").gte("run_at", sevenDaysAgo)
    ]);

    const recentUsers = recentUsersResult.data ?? [];
    const recentShares = recentSharesResult.data ?? [];
    const weeklyLabels = ["1일", "2일", "3일", "4일", "5일", "6일", "7일"];
    const weeklySignupSeries = weeklyLabels.map((label, index) => {
      const target = new Date();
      target.setDate(target.getDate() - (6 - index));
      const dateKey = target.toISOString().slice(0, 10);
      const count = recentUsers.filter((user) => String(user.created_at ?? "").slice(0, 10) === dateKey).length;
      return { label, value: count };
    });

    const monthlySignupSeries = Array.from({ length: 4 }).map((_, index) => {
      const start = new Date();
      start.setDate(start.getDate() - (27 - index * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const count = recentUsers.filter((user) => {
        const date = new Date(String(user.created_at ?? ""));
        return date >= start && date <= end;
      }).length;
      return { label: `${index + 1}주`, value: count };
    });

    const weeklyShareSeries = weeklyLabels.map((label, index) => {
      const target = new Date();
      target.setDate(target.getDate() - (6 - index));
      const dateKey = target.toISOString().slice(0, 10);
      const count = recentShares.filter((log) => String(log.run_at ?? "").slice(0, 10) === dateKey).length;
      return { label, value: count };
    });

    return {
      userCount: userCountResult.count ?? 0,
      contentCount: contentCountResult.count ?? 0,
      latestEmailLog: latestEmailLogResult.data ?? null,
      recentSignupCount: recentUsers.filter((user) => String(user.created_at ?? "") >= sevenDaysAgo).length,
      recentShareCount: recentShares.length,
      weeklySignupSeries,
      monthlySignupSeries,
      weeklyShareSeries
    };
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const sevenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
  const [userCount, contentCount, latestEmailLog, recentSignupCount, recentShareCount, recentUsers, recentShares] = await Promise.all([
    collections.users.countDocuments(),
    collections.contentItems.countDocuments(),
    collections.emailLogs.find({}).sort({ sent_at: -1 }).limit(1).next(),
    collections.users.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
    collections.jobLogs.countDocuments({
      job_name: "share.action",
      run_at: { $gte: sevenDaysAgo }
    }),
    collections.users.find({ created_at: { $gte: thirtyDaysAgo } }).project({ created_at: 1 }).toArray(),
    collections.jobLogs.find({ job_name: "share.action", run_at: { $gte: sevenDaysAgo } }).project({ run_at: 1 }).toArray()
  ]);

  const weeklyLabels = ["1일", "2일", "3일", "4일", "5일", "6일", "7일"];
  const weeklySignupSeries = weeklyLabels.map((label, index) => {
    const target = new Date();
    target.setDate(target.getDate() - (6 - index));
    const dateKey = target.toISOString().slice(0, 10);
    const count = recentUsers.filter((user) => String(user.created_at ?? "").slice(0, 10) === dateKey).length;
    return { label, value: count };
  });

  const monthlySignupSeries = Array.from({ length: 4 }).map((_, index) => {
    const start = new Date();
    start.setDate(start.getDate() - (27 - index * 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const count = recentUsers.filter((user) => {
      const date = new Date(String(user.created_at ?? ""));
      return date >= start && date <= end;
    }).length;
    return { label: `${index + 1}주`, value: count };
  });

  const weeklyShareSeries = weeklyLabels.map((label, index) => {
    const target = new Date();
    target.setDate(target.getDate() - (6 - index));
    const dateKey = target.toISOString().slice(0, 10);
    const count = recentShares.filter((log) => String(log.run_at ?? "").slice(0, 10) === dateKey).length;
    return { label, value: count };
  });

  return {
    userCount,
    contentCount,
    latestEmailLog,
    recentSignupCount,
    recentShareCount,
    weeklySignupSeries,
    monthlySignupSeries,
    weeklyShareSeries
  };
}

export async function listDashboardEmailLogs() {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from("email_logs").select("*").order("sent_at", { ascending: false }).limit(30);
    return data ?? [];
  }

  const db = await getMongoDb();
  return getSlmCollections(db).emailLogs.find({}).sort({ sent_at: -1 }).limit(30).toArray();
}

export async function listDashboardJobLogs() {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from("job_logs").select("*").order("run_at", { ascending: false }).limit(30);
    return data ?? [];
  }

  const db = await getMongoDb();
  return getSlmCollections(db).jobLogs.find({}).sort({ run_at: -1 }).limit(30).toArray();
}

export async function updateContentItem(
  id: string,
  input: {
    title: string;
    category: string;
    subInterest?: string | null;
    thumbnailUrl?: string | null;
    thumbnailAlt?: string | null;
    thumbnailPageUrl?: string | null;
    thumbnailAuthor?: string | null;
    thumbnailLicense?: string | null;
    sourceName: string;
    sourceUrl: string;
    sourceType: "public" | "news" | "blog" | "other";
    shortSummary: string;
    longSummary?: string;
    actionLine: string;
    rawText: string;
    summaryType: "MUST" | "USEFUL" | "ACTION";
    approvalStatus: "pending" | "approved" | "rejected";
    aiStatus: "pending" | "completed" | "failed";
  }
) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    await supabase
      .from("content_items")
      .update({
        title: input.title,
        category: input.category,
        sub_interest: input.subInterest ?? null,
        ...(input.thumbnailUrl !== undefined ? { thumbnail_url: input.thumbnailUrl ?? null } : {}),
        ...(input.thumbnailAlt !== undefined ? { thumbnail_alt: input.thumbnailAlt ?? null } : {}),
        ...(input.thumbnailPageUrl !== undefined ? { thumbnail_page_url: input.thumbnailPageUrl ?? null } : {}),
        ...(input.thumbnailAuthor !== undefined ? { thumbnail_author: input.thumbnailAuthor ?? null } : {}),
        ...(input.thumbnailLicense !== undefined ? { thumbnail_license: input.thumbnailLicense ?? null } : {}),
        source_name: input.sourceName,
        source_url: input.sourceUrl,
        sources: [{ name: input.sourceName, url: input.sourceUrl, type: input.sourceType }],
        short_summary: input.shortSummary,
        ...(input.longSummary !== undefined ? { long_summary: input.longSummary } : {}),
        action_line: input.actionLine,
        raw_text: input.rawText,
        summary_type: input.summaryType,
        approval_status: input.approvalStatus,
        ai_status: input.aiStatus,
        published_at: input.approvalStatus === "approved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
    return;
  }

  const db = await getMongoDb();
  const objectId = objectIdOf(id);
  if (!objectId) {
    throw new Error("INVALID_CONTENT_ID");
  }

  await getSlmCollections(db).contentItems.updateOne(
    { _id: objectId },
    {
      $set: {
        title: input.title,
        category: input.category,
        sub_interest: input.subInterest ?? null,
        ...(input.thumbnailUrl !== undefined ? { thumbnail_url: input.thumbnailUrl ?? null } : {}),
        ...(input.thumbnailAlt !== undefined ? { thumbnail_alt: input.thumbnailAlt ?? null } : {}),
        ...(input.thumbnailPageUrl !== undefined ? { thumbnail_page_url: input.thumbnailPageUrl ?? null } : {}),
        ...(input.thumbnailAuthor !== undefined ? { thumbnail_author: input.thumbnailAuthor ?? null } : {}),
        ...(input.thumbnailLicense !== undefined ? { thumbnail_license: input.thumbnailLicense ?? null } : {}),
        source_name: input.sourceName,
        source_url: input.sourceUrl,
        sources: [{ name: input.sourceName, url: input.sourceUrl, type: input.sourceType }],
        short_summary: input.shortSummary,
        ...(input.longSummary !== undefined ? { long_summary: input.longSummary } : {}),
        action_line: input.actionLine,
        raw_text: input.rawText,
        summary_type: input.summaryType,
        approval_status: input.approvalStatus,
        ai_status: input.aiStatus,
        published_at: input.approvalStatus === "approved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }
    }
  );
}
