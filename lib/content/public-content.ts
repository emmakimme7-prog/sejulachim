import "server-only";

import { unstable_cache } from "next/cache";

import { getDisplayMainInterest, getStoredCategoryForMainInterest } from "@/lib/content/sub-interests";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const PUBLIC_CONTENT_REVALIDATE_SECONDS = 30;

function decodeSlugValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePublicItemCategory<T extends { category?: string | null; sub_interest?: string | null }>(item: T) {
  return {
    ...item,
    category: getDisplayMainInterest(item.category, item.sub_interest)
  };
}

const listPublicContentItemsCached = unstable_cache(
  async (limit: number) => {
    if (!hasSupabaseServerEnv()) {
      return [];
    }

    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from('sj_content_items')
      .select("id, title, short_summary, long_summary, action_line, source_name, source_url, sources, slug, published_at, summary_type, category, sub_interest, raw_text, thumbnail_url, thumbnail_alt, thumbnail_page_url, thumbnail_license, audio_url")
      .eq("approval_status", "approved")
      .or("summary_status.eq.done,ai_status.eq.completed")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(limit);

    return (data ?? []).map((item) => normalizePublicItemCategory(item));
  },
  ["public-content-list-v2"],
  { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS }
);

const getPublicContentItemBySlugCached = unstable_cache(
  async (slug: string) => {
    if (!hasSupabaseServerEnv()) {
      return null;
    }

    const decodedSlug = decodeSlugValue(slug);
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from('sj_content_items')
      .select("id, title, short_summary, long_summary, action_line, source_name, source_url, sources, slug, published_at, summary_type, category, sub_interest, raw_text, thumbnail_url, thumbnail_alt, thumbnail_page_url, thumbnail_license, audio_url")
      .eq("slug", decodedSlug)
      .eq("approval_status", "approved")
      .or("summary_status.eq.done,ai_status.eq.completed")
      .maybeSingle();

    return data ? normalizePublicItemCategory(data) : null;
  },
  ["public-content-detail-v2"],
  { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS }
);

const listRelatedPublicContentItemsCached = unstable_cache(
  async (category: string, slug: string, limit: number) => {
    if (!hasSupabaseServerEnv()) {
      return [];
    }

    const decodedSlug = decodeSlugValue(slug);
    const supabase = createAdminSupabaseClient();
    const storedCategory = getStoredCategoryForMainInterest(category);
    const { data } = await supabase
      .from('sj_content_items')
      .select("title, short_summary, long_summary, action_line, slug, published_at, category, sub_interest, thumbnail_url, thumbnail_alt, audio_url")
      .eq("approval_status", "approved")
      .or("summary_status.eq.done,ai_status.eq.completed")
      .eq("category", storedCategory)
      .neq("slug", decodedSlug)
      .order("published_at", { ascending: false })
      .limit(limit);

    return (data ?? [])
      .filter((item) => item.slug !== decodedSlug)
      .map((item) => normalizePublicItemCategory(item));
  },
  ["public-content-related-v2"],
  { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS }
);

export async function listPublicContentItems(limit: number) {
  return listPublicContentItemsCached(limit);
}

export async function getPublicContentItemBySlug(slug: string) {
  return getPublicContentItemBySlugCached(slug);
}

export async function listRelatedPublicContentItems(category: string, slug: string, limit: number) {
  return listRelatedPublicContentItemsCached(category, slug, limit);
}

/** 오늘의 세줄 미리보기: 5개 카테고리별 당일 콘텐츠 중 가장 자극적인 제목 1개씩. 오늘 콘텐츠가 없으면 최신 콘텐츠로 대체. */
const listTodayPreviewCached = unstable_cache(
  async () => {
    if (!hasSupabaseServerEnv()) return [];

    const supabase = createAdminSupabaseClient();
    // KST 기준 오늘 0시
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayStart = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - kstOffset);

    // 오늘 콘텐츠 조회 — audio_url 없거나 깨진 경우 client에서 Web Speech fallback으로 재생됨.
    const { data } = await supabase
      .from('sj_content_items')
      .select("title, slug, category, sub_interest, short_summary, action_line, audio_url")
      .eq("approval_status", "approved")
      .or("summary_status.eq.done,ai_status.eq.completed")
      .gte("published_at", todayStart.toISOString())
      .order("published_at", { ascending: false })
      .limit(100);

    let items = (data ?? []).map((item) => normalizePublicItemCategory(item));

    // 오늘 콘텐츠가 5개 카테고리 못 채우면 최신 콘텐츠로 보충
    if (items.length < 5) {
      const { data: fallbackData } = await supabase
        .from('sj_content_items')
        .select("title, slug, category, sub_interest, short_summary, action_line, audio_url")
        .eq("approval_status", "approved")
        .or("summary_status.eq.done,ai_status.eq.completed")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(100);

      const fallbackItems = (fallbackData ?? []).map((item) => normalizePublicItemCategory(item));
      const existingSlugs = new Set(items.map((i) => i.slug));
      for (const fi of fallbackItems) {
        if (!existingSlugs.has(fi.slug)) {
          items.push(fi);
          existingSlugs.add(fi.slug);
        }
      }
    }

    const categories = ["건강", "돈", "실생활", "뉴스", "관계"];
    const result: {
      category: string;
      title: string;
      slug: string;
      short_summary?: string;
      action_line?: string;
      audio_url?: string;
    }[] = [];

    // 현재 살아있는 Supabase storage host (NEW autoclip). audio_url이 이 host를 가리키면
    // 실제 mp3 파일이 있어 정상 재생됨. 다른 host(구 프로젝트)는 깨진 URL이라 client에서 Web Speech fallback.
    const liveSupabaseHost = (() => {
      try {
        const url = process.env.SUPABASE_URL ?? "";
        return url ? new URL(url).host : "";
      } catch {
        return "";
      }
    })();

    const isLiveAudio = (raw: string | null | undefined) => {
      if (!raw || !liveSupabaseHost) return false;
      try {
        return new URL(raw).host === liveSupabaseHost;
      } catch {
        return false;
      }
    };

    for (const cat of categories) {
      const catItems = items.filter((item) => item.category === cat);
      // 1순위: 현재 storage(autoclip)에서 실제 재생되는 audio_url
      // 2순위: 제목이 긴 항목 (구체적인 콘텐츠 우선)
      catItems.sort((a, b) => {
        const aLive = isLiveAudio((a as { audio_url?: string | null }).audio_url);
        const bLive = isLiveAudio((b as { audio_url?: string | null }).audio_url);
        if (aLive !== bLive) return aLive ? -1 : 1;
        return b.title.length - a.title.length;
      });
      const pick = catItems[0];
      if (pick) {
        result.push({
          category: cat,
          title: pick.title,
          slug: pick.slug,
          short_summary: pick.short_summary ?? undefined,
          action_line: (pick as { action_line?: string | null }).action_line ?? undefined,
          audio_url: (pick as { audio_url?: string | null }).audio_url ?? undefined,
        });
      }
    }

    return result;
  },
  ["today-preview-v2"],
  { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS }
);

export async function listTodayPreview() {
  return listTodayPreviewCached();
}
