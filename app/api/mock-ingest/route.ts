import { NextRequest, NextResponse } from "next/server";

import { getServerEnv, hasSupabaseServerEnv } from "@/lib/env";
import { createSlug, sanitizePlainText } from "@/lib/utils";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mockIngestSchema } from "@/lib/validation/admin";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-ingest-secret");
    if (secret !== getServerEnv().CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = mockIngestSchema.parse(await request.json());
    if (!hasSupabaseServerEnv()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("content_items").insert({
      title: sanitizePlainText(payload.title, 160),
      category: payload.category,
      source_name: sanitizePlainText(payload.sourceName, 80),
      source_url: payload.sourceUrl,
      sources: [{ name: sanitizePlainText(payload.sourceName, 80), url: payload.sourceUrl, type: payload.sourceType }],
      raw_text: sanitizePlainText(payload.rawText, 10000),
      summary_type: payload.summaryType,
      approval_status: "pending",
      summary_status: "pending",
      slug: createSlug("brief")
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "콘텐츠를 저장하지 못했습니다." }, { status: 400 });
  }
}
