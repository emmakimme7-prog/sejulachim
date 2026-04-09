import "server-only";

import { unstable_cache } from "next/cache";

import { getMongoDb } from "@/lib/mongodb/client";
import { getSlmCollections } from "@/lib/mongodb/collections";
import { hasMongoServerEnv, hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type TodaySectionSettings = {
  sectionTitle: string;
  sectionDescription: string;
  imageUrl?: string;
  imageAlt: string;
  imageTitle: string;
  imageDescription: string;
};

export type HomeHeroSettings = {
  title: string;
  subtitle: string;
  useImage: boolean;
  imageUrl?: string;
};

const TODAY_SECTION_KEY = "home_today_section";
const HOME_HERO_KEY = "home_hero_section";
const SETTINGS_REVALIDATE_SECONDS = 300;

export function getDefaultTodaySectionSettings(): TodaySectionSettings {
  return {
    sectionTitle: "오늘의 소식",
    sectionDescription: "건강, 돈, 실생활, 뉴스, 관계에서 지금 바로 읽어둘 최신 소식을 골라 보여드립니다.",
    imageUrl: "",
    imageAlt: "오늘의 소식 대표 이미지",
    imageTitle: "생활에 바로 닿는 세 가지",
    imageDescription: "건강, 돈, 실생활, 뉴스, 관계 중 고른 관심사별로 최신 소식을 세 개씩 간단히 살펴보실 수 있습니다."
  };
}

export function getDefaultHomeHeroSettings(): HomeHeroSettings {
  return {
    title: "복잡한 뉴스 대신,",
    subtitle:
      "세줄아침은 한국 사용자를 위한 생활형 아침 브리핑 서비스입니다. 건강, 돈, 실생활, 뉴스, 관계 중 관심사를 고르면 매일 아침 읽기 쉬운 세 줄 요약을 이메일로 보내드립니다.",
    useImage: true,
    imageUrl: "/sejulachim-seo.jpg"
  };
}

const getCachedTodaySectionSettingsFromSupabase = unstable_cache(
  async (): Promise<TodaySectionSettings> => {
    const supabase = createAdminSupabaseClient();
    const { data: row } = await supabase.from("site_settings").select("*").eq("key", TODAY_SECTION_KEY).maybeSingle();
    const fallback = getDefaultTodaySectionSettings();

    if (!row) {
      return fallback;
    }

    return {
      sectionTitle: row.section_title?.trim() || fallback.sectionTitle,
      sectionDescription: row.section_description?.trim() || fallback.sectionDescription,
      imageUrl: row.image_url?.trim() || "",
      imageAlt: row.image_alt?.trim() || fallback.imageAlt,
      imageTitle: row.image_title?.trim() || fallback.imageTitle,
      imageDescription: row.image_description?.trim() || fallback.imageDescription
    };
  },
  ["site-settings-today-section"],
  { revalidate: SETTINGS_REVALIDATE_SECONDS }
);

const getCachedHomeHeroSettingsFromSupabase = unstable_cache(
  async (): Promise<HomeHeroSettings> => {
    const supabase = createAdminSupabaseClient();
    const { data: row } = await supabase.from("site_settings").select("*").eq("key", HOME_HERO_KEY).maybeSingle();
    const fallback = getDefaultHomeHeroSettings();

    if (!row) {
      return fallback;
    }

    return {
      title: row.title?.trim() || fallback.title,
      subtitle: row.subtitle?.trim() || fallback.subtitle,
      useImage: typeof row.use_image === "boolean" ? row.use_image : fallback.useImage,
      imageUrl: row.image_url?.trim() || ""
    };
  },
  ["site-settings-home-hero"],
  { revalidate: SETTINGS_REVALIDATE_SECONDS }
);

export async function getTodaySectionSettings(): Promise<TodaySectionSettings> {
  if (hasSupabaseServerEnv()) {
    return getCachedTodaySectionSettingsFromSupabase();
  }

  if (!hasMongoServerEnv()) {
    return getDefaultTodaySectionSettings();
  }

  const db = await getMongoDb();
  const row = await getSlmCollections(db).siteSettings.findOne({ key: TODAY_SECTION_KEY });
  const fallback = getDefaultTodaySectionSettings();

  if (!row) {
    return fallback;
  }

  return {
    sectionTitle: row.section_title?.trim() || fallback.sectionTitle,
    sectionDescription: row.section_description?.trim() || fallback.sectionDescription,
    imageUrl: row.image_url?.trim() || "",
    imageAlt: row.image_alt?.trim() || fallback.imageAlt,
    imageTitle: row.image_title?.trim() || fallback.imageTitle,
    imageDescription: row.image_description?.trim() || fallback.imageDescription
  };
}

export async function getHomeHeroSettings(): Promise<HomeHeroSettings> {
  if (hasSupabaseServerEnv()) {
    return getCachedHomeHeroSettingsFromSupabase();
  }

  if (!hasMongoServerEnv()) {
    return getDefaultHomeHeroSettings();
  }

  const db = await getMongoDb();
  const row = await getSlmCollections(db).siteSettings.findOne({ key: HOME_HERO_KEY });
  const fallback = getDefaultHomeHeroSettings();

  if (!row) {
    return fallback;
  }

  return {
    title: row.title?.trim() || fallback.title,
    subtitle: row.subtitle?.trim() || fallback.subtitle,
    useImage: typeof row.use_image === "boolean" ? row.use_image : fallback.useImage,
    imageUrl: row.image_url?.trim() || ""
  };
}

export async function updateTodaySectionSettings(input: TodaySectionSettings) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();

    await supabase.from("site_settings").upsert(
      {
        key: TODAY_SECTION_KEY,
        section_title: input.sectionTitle.trim(),
        section_description: input.sectionDescription.trim(),
        image_url: (input.imageUrl ?? "").trim(),
        image_alt: input.imageAlt.trim(),
        image_title: input.imageTitle.trim(),
        image_description: input.imageDescription.trim(),
        updated_at: now
      },
      { onConflict: "key" }
    );

    return;
  }

  if (!hasMongoServerEnv()) {
    return;
  }

  const db = await getMongoDb();
  const now = new Date().toISOString();

  await getSlmCollections(db).siteSettings.updateOne(
    { key: TODAY_SECTION_KEY },
    {
      $set: {
        key: TODAY_SECTION_KEY,
        section_title: input.sectionTitle.trim(),
        section_description: input.sectionDescription.trim(),
        image_url: (input.imageUrl ?? "").trim(),
        image_alt: input.imageAlt.trim(),
        image_title: input.imageTitle.trim(),
        image_description: input.imageDescription.trim(),
        updated_at: now
      }
    },
    { upsert: true }
  );
}

export async function updateHomeHeroSettings(input: HomeHeroSettings) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();

    await supabase.from("site_settings").upsert(
      {
        key: HOME_HERO_KEY,
        title: input.title.trim(),
        subtitle: input.subtitle.trim(),
        use_image: input.useImage,
        image_url: (input.imageUrl ?? "").trim(),
        image_alt: "세줄아침 메인 이미지",
        updated_at: now
      },
      { onConflict: "key" }
    );

    return;
  }

  if (!hasMongoServerEnv()) {
    return;
  }

  const db = await getMongoDb();
  const now = new Date().toISOString();

  await getSlmCollections(db).siteSettings.updateOne(
    { key: HOME_HERO_KEY },
    {
      $set: {
        key: HOME_HERO_KEY,
        title: input.title.trim(),
        subtitle: input.subtitle.trim(),
        use_image: input.useImage,
        image_url: (input.imageUrl ?? "").trim(),
        image_alt: "세줄아침 메인 이미지",
        updated_at: now
      }
    },
    { upsert: true }
  );
}
