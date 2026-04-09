import { NextRequest, NextResponse } from "next/server";

import { assertAdminRequest } from "@/lib/auth/admin";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createSlug, sanitizePlainText } from "@/lib/utils";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createContentItemSchema } from "@/lib/validation/admin";

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest();
    const isJson = request.headers.get("content-type")?.includes("application/json");
    const formData = isJson ? null : await request.formData();
    const json = isJson ? await request.json() : null;
    const payload = createContentItemSchema.parse({
      title: isJson ? json?.title : formData?.get("title"),
      category: isJson ? json?.category : formData?.get("category"),
      subInterest: isJson ? json?.subInterest : formData?.get("subInterest"),
      sourceName: isJson ? json?.sourceName : formData?.get("sourceName"),
      sourceUrl: isJson ? json?.sourceUrl : formData?.get("sourceUrl"),
      sourceType: isJson ? json?.sourceType : formData?.get("sourceType"),
      rawText: isJson ? json?.rawText : formData?.get("rawText"),
      summaryType: isJson ? json?.summaryType : formData?.get("summaryType")
    });

    if (!hasSupabaseServerEnv()) {
      throw new Error("SUPABASE_ENV_MISSING");
    }

    const supabase = createAdminSupabaseClient();
    await supabase.from("content_items").insert({
      title: sanitizePlainText(payload.title, 160),
      category: payload.category,
      sub_interest: payload.subInterest ? sanitizePlainText(payload.subInterest, 80) : null,
      source_name: sanitizePlainText(payload.sourceName, 80),
      source_url: payload.sourceUrl,
      sources: [{ name: sanitizePlainText(payload.sourceName, 80), url: payload.sourceUrl, type: payload.sourceType }],
      raw_text: sanitizePlainText(payload.rawText, 10000),
      summary_type: payload.summaryType,
      approval_status: "pending",
      summary_status: "pending",
      slug: createSlug("brief")
    });

    if (isJson) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.redirect(new URL("/dashboard/contents", request.url), 303);
  } catch {
    if (request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "콘텐츠를 저장하지 못했습니다." }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/dashboard/contents", request.url), 303);
  }
}
