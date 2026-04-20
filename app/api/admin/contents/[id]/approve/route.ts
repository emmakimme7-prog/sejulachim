import { NextRequest, NextResponse } from "next/server";

import { assertAdminRequest } from "@/lib/auth/admin";
import { generateAndStoreContentAudio } from "@/lib/content/audio";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  try {
    await assertAdminRequest();
    if (!hasSupabaseServerEnv()) {
      throw new Error("SUPABASE_ENV_MISSING");
    }
    const supabase = createAdminSupabaseClient();
    await supabase
      .from("content_items")
      .update({ approval_status: "approved", published_at: new Date().toISOString() })
      .eq("id", id);

    // TTS 생성은 fire-and-forget — 실패해도 승인은 이미 완료
    generateAndStoreContentAudio(id).catch((error) => {
      console.warn("[admin] audio generation failed", { id, error: (error as Error).message });
    });
  } catch (error) {
    console.error("[admin] approve failed", { id, error });
  }

  return NextResponse.redirect(new URL("/dashboard/contents", request.url), 303);
}
