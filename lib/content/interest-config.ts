import "server-only";

import { unstable_cache } from "next/cache";

import { hasSupabaseServerEnv } from "@/lib/env";
import { MAIN_INTERESTS, SUB_INTERESTS } from "@/lib/content/sub-interests";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type InterestConfig = {
  mainInterests: string[];
  labels: Record<string, string>;
  subInterests: Record<string, string[]>;
};

type StoredInterestConfig = {
  categories?: Array<{
    key?: string;
    label?: string;
    subInterests?: string[];
    order?: number;
  }>;
};

export function getDefaultInterestConfig(): InterestConfig {
  const labels = Object.fromEntries(MAIN_INTERESTS.map((interest) => [interest, interest])) as Record<string, string>;
  return {
    mainInterests: [...MAIN_INTERESTS],
    labels,
    subInterests: { ...SUB_INTERESTS }
  };
}

const getCachedInterestConfigFromSupabase = unstable_cache(
  async (): Promise<InterestConfig> => {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from("site_settings").select("*").eq("key", "interest_config").maybeSingle();

    let stored: StoredInterestConfig | null = null;
    if (data && typeof (data as { value?: unknown }).value === "object") {
      stored = ((data as { value?: unknown }).value ?? null) as StoredInterestConfig | null;
    } else if (typeof data?.title === "string" && data.title.trim()) {
      try {
        const parsed = JSON.parse(data.title) as StoredInterestConfig | InterestConfig;
        if (Array.isArray((parsed as StoredInterestConfig).categories)) {
          stored = parsed as StoredInterestConfig;
        } else {
          const legacy = parsed as InterestConfig;
          stored = {
            categories: (legacy.mainInterests ?? []).map((key, index) => ({
              key,
              label: legacy.labels?.[key] ?? key,
              subInterests: legacy.subInterests?.[key] ?? [],
              order: index
            }))
          };
        }
      } catch {
        stored = null;
      }
    }

    const rows = stored?.categories ?? [];

    if (rows.length === 0) {
      return getDefaultInterestConfig();
    }

    const sortedRows = [...rows].sort((left, right) => (left.order ?? 999) - (right.order ?? 999));
    const labels: Record<string, string> = {};
    const subInterests: Record<string, string[]> = {};
    const mainInterests = sortedRows.map((row) => row.key?.trim()).filter((value): value is string => Boolean(value));

    for (const row of sortedRows) {
      const key = row.key?.trim();
      if (!key) {
        continue;
      }

      labels[key] = row.label?.trim() || key;
      subInterests[key] = (row.subInterests ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 5);
    }

    return {
      mainInterests,
      labels,
      subInterests
    };
  },
  ["interest-config"],
  { revalidate: 300 }
);

export async function getInterestConfig(): Promise<InterestConfig> {
  if (!hasSupabaseServerEnv()) {
    return getDefaultInterestConfig();
  }

  return getCachedInterestConfigFromSupabase();
}

export async function updateInterestConfig(input: Array<{ key: string; label: string; subInterests: string[]; order: number }>) {
  if (!hasSupabaseServerEnv()) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const categories = input.map((item) => ({
    key: item.key.trim(),
    label: item.label.trim(),
    subInterests: item.subInterests.map((subInterest) => subInterest.trim()).filter(Boolean).slice(0, 5),
    order: item.order
  }));

  await supabase.from("site_settings").upsert(
    {
      key: "interest_config",
      title: JSON.stringify({
        mainInterests: categories.map((item) => item.key),
        labels: Object.fromEntries(categories.map((item) => [item.key, item.label])),
        subInterests: Object.fromEntries(categories.map((item) => [item.key, item.subInterests]))
      }),
      updated_at: now
    },
    { onConflict: "key" }
  );
}

export async function seedDefaultInterestConfig() {
  if (!hasSupabaseServerEnv()) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from("site_settings").select("key").eq("key", "interest_config").maybeSingle();
  if (data?.key) {
    return;
  }

  await updateInterestConfig(
    MAIN_INTERESTS.map((key, index) => ({
      key,
      label: key,
      subInterests: SUB_INTERESTS[key] ?? [],
      order: index
    }))
  );
}
