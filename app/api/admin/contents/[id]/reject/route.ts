import { NextRequest, NextResponse } from "next/server";

import { assertAdminRequest } from "@/lib/auth/admin";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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
    await supabase.from('sj_content_items').update({ approval_status: "rejected", published_at: null }).eq("id", id);
  } catch (error) {
    console.error("[admin] reject failed", { id: (await params).id, error });
  }

  return NextResponse.redirect(new URL("/dashboard/contents", request.url), 303);
}
