import "server-only";

import { unstable_cache } from "next/cache";

import { getDisplayMainInterest, getStoredCategoryForMainInterest } from "@/lib/content/sub-interests";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const PUBLIC_CONTENT_REVALIDATE_SECONDS = 60;

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
      .from("content_items")
      .select("id, title, short_summary, long_summary, action_line, source_name, source_url, sources, slug, published_at, summary_type, category, sub_interest, raw_text, thumbnail_url, thumbnail_alt, thumbnail_page_url, thumbnail_license")
      .eq("approval_status", "approved")
      .or("summary_status.eq.done,ai_status.eq.completed")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(limit);

    return (data ?? []).map((item) => normalizePublicItemCategory(item));
  },
  ["public-content-list"],
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
      .from("content_items")
      .select("id, title, short_summary, long_summary, action_line, source_name, source_url, sources, slug, published_at, summary_type, category, sub_interest, raw_text, thumbnail_url, thumbnail_alt, thumbnail_page_url, thumbnail_license")
      .eq("slug", decodedSlug)
      .eq("approval_status", "approved")
      .or("summary_status.eq.done,ai_status.eq.completed")
      .maybeSingle();

    return data ? normalizePublicItemCategory(data) : null;
  },
  ["public-content-detail"],
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
      .from("content_items")
      .select("title, short_summary, long_summary, action_line, slug, published_at, category, sub_interest, thumbnail_url, thumbnail_alt")
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
  ["public-content-related"],
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
