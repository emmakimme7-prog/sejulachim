import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

import { findRelatedContentThumbnail } from "@/lib/content/thumbnails";
import { getServerEnv } from "@/lib/env";
import { isAuthorizedCronRequest } from "@/lib/security/request";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type ContentRow = {
  id: string;
  title: string;
  category: string | null;
  sub_interest: string | null;
  short_summary: string | null;
  thumbnail_url: string | null;
};

/**
 * 깨진 썸네일 복구 엔드포인트
 * 대상:
 *  1. thumbnail_url이 null 또는 빈 문자열
 *  2. thumbnail_url이 pixabay.com 원본 URL (만료됨)
 *  3. thumbnail_url이 wikimedia 원본 (가끔 깨짐)
 *  4. ?force=1 쿼리로 강제 전체 재생성 가능
 *
 * 호출 예시:
 *   GET /api/cron/repair-thumbnails?limit=20
 *   GET /api/cron/repair-thumbnails?limit=5&force=1
 */
async function handleRepair(request: NextRequest) {
  if (!isAuthorizedCronRequest(request, getServerEnv().CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 20), 50);
  const force = request.nextUrl.searchParams.get("force") === "1";
  const supabase = createAdminSupabaseClient();

  // 복구 대상 조회
  let query = supabase
    .from('sj_content_items')
    .select("id, title, category, sub_interest, short_summary, thumbnail_url")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (!force) {
    // pixabay.com (만료 원본) 또는 null만 대상
    query = query.or("thumbnail_url.is.null,thumbnail_url.like.%pixabay.com%,thumbnail_url.eq.");
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as ContentRow[];
  const results: Array<{ id: string; title: string; status: "fixed" | "skipped" | "failed"; url?: string; reason?: string }> = [];

  for (const row of rows) {
    try {
      const thumbnail = await findRelatedContentThumbnail({
        title: row.title,
        category: row.category ?? "",
        subInterest: row.sub_interest,
        summary: row.short_summary,
      });

      if (!thumbnail?.url) {
        results.push({ id: row.id, title: row.title, status: "skipped", reason: "no thumbnail found" });
        continue;
      }

      const { error: updateError } = await supabase
        .from('sj_content_items')
        .update({
          thumbnail_url: thumbnail.url,
          thumbnail_alt: thumbnail.alt,
        })
        .eq("id", row.id);

      if (updateError) {
        results.push({ id: row.id, title: row.title, status: "failed", reason: updateError.message });
      } else {
        results.push({ id: row.id, title: row.title, status: "fixed", url: thumbnail.url });
      }
    } catch (err) {
      results.push({
        id: row.id,
        title: row.title,
        status: "failed",
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const summary = {
    total: results.length,
    fixed: results.filter((r) => r.status === "fixed").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
  };

  return NextResponse.json({ ok: true, summary, results });
}

export async function GET(request: NextRequest) {
  return handleRepair(request);
}

export async function POST(request: NextRequest) {
  return handleRepair(request);
}
