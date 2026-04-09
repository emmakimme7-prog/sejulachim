import { NextRequest, NextResponse } from "next/server";

import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { unsubscribeSchema } from "@/lib/validation/admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload = unsubscribeSchema.parse({
      token: formData.get("token")
    });

    if (hasSupabaseServerEnv()) {
      const now = new Date().toISOString();
      const { hashToken } = await import("@/lib/security/request");
      const tokenHash = hashToken(payload.token);
      const supabase = createAdminSupabaseClient();
      const { data: tokenRow } = await supabase
        .from("unsubscribe_tokens")
        .select("id, user_id, used_at")
        .eq("token_hash", tokenHash)
        .is("used_at", null)
        .single();

      if (!tokenRow) {
        return NextResponse.redirect(new URL("/unsubscribe", request.url), 303);
      }

      await supabase.from("users").update({ is_active: false, unsubscribed_at: now }).eq("id", tokenRow.user_id);
      await supabase.from("unsubscribe_tokens").update({ used_at: now }).eq("id", tokenRow.id);
    } else {
      return NextResponse.redirect(new URL("/unsubscribe", request.url), 303);
    }

    return NextResponse.redirect(new URL("/unsubscribe?status=done", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/unsubscribe", request.url), 303);
  }
}
