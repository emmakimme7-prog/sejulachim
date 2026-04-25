import { NextRequest, NextResponse } from "next/server";

import { assertAdminRequest } from "@/lib/auth/admin";
import { findRelatedContentThumbnail } from "@/lib/content/thumbnails";
import { summarizeContentItem } from "@/lib/content/summarize";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sanitizePlainText } from "@/lib/utils";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    await assertAdminRequest();
    const { id } = await params;
    if (!hasSupabaseServerEnv()) {
      throw new Error("SUPABASE_ENV_MISSING");
    }
    const supabase = createAdminSupabaseClient();
    await supabase.from('sj_content_items').update({ summary_status: "processing", updated_at: new Date().toISOString() }).eq("id", id);

    const { data: item } = await supabase
      .from('sj_content_items')
      .select("id, title, category, sub_interest, raw_text, summary_type, short_summary")
      .eq("id", id)
      .single();

    if (!item) {
      throw new Error("CONTENT_NOT_FOUND");
    }

    if (item.short_summary) {
      return NextResponse.redirect(new URL("/dashboard/contents", request.url), 303);
    }

    const summarized = await summarizeContentItem({
      title: item.title,
      category: item.category,
      rawText: item.raw_text,
      summaryType: item.summary_type
    });
    const thumbnail = await findRelatedContentThumbnail({
      title: item.title,
      category: item.category,
      subInterest: item.sub_interest ?? null,
      summary: summarized.shortSummary ?? null
    });

    await supabase
      .from('sj_content_items')
      .update({
        title: sanitizePlainText(summarized.title, 30),
        short_summary: sanitizePlainText(summarized.shortSummary, 300),
        long_summary: sanitizePlainText(summarized.longSummary, 4000),
        action_line: sanitizePlainText(summarized.actionLine, 160),
        summary_type: summarized.summaryType,
        ai_status: "completed",
        summary_status: "done",
        thumbnail_url: thumbnail?.url ?? null,
        thumbnail_alt: thumbnail?.alt ?? null,
        thumbnail_page_url: thumbnail?.pageUrl ?? null,
        thumbnail_author: thumbnail?.author ?? null,
        thumbnail_license: thumbnail?.license ?? null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
  } catch {
    const { id } = await params;
    if (hasSupabaseServerEnv()) {
      const supabase = createAdminSupabaseClient();
      await supabase.from('sj_content_items').update({ ai_status: "failed", summary_status: "failed", updated_at: new Date().toISOString() }).eq("id", id);
    }
  }

  return NextResponse.redirect(new URL("/dashboard/contents", request.url), 303);
}
