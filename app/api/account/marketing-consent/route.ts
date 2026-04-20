import { NextRequest, NextResponse } from "next/server";

import { requireUserSession } from "@/lib/auth/user-session";
import { hasSupabaseServerEnv } from "@/lib/env";
import { addSecurityJobLog } from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// DELETE: 광고성 정보 수신 동의 철회 (정보통신망법 제50조 이행)
// - marketing_consent_at = NULL
// - unsubscribed_at = now() (크론이 자동 skip)
// - delivery_kakao, delivery_email = false
export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireUserSession();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`account:marketing:${session.id}:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    if (!hasSupabaseServerEnv()) {
      return NextResponse.json({ error: "서버 설정 오류" }, { status: 503 });
    }

    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("users")
      .update({
        marketing_consent_at: null,
        unsubscribed_at: now,
        delivery_kakao: false,
        delivery_email: false,
        updated_at: now
      })
      .eq("id", session.id);

    if (error) {
      console.error("[/api/account/marketing-consent] revoke failed:", error);
      await addSecurityJobLog("account.marketing_revoke", "failed", `user=${session.id}; ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await addSecurityJobLog("account.marketing_revoke", "success", `user=${session.id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/account/marketing-consent] failed:", error);
    return NextResponse.json({ error: "처리하지 못했습니다." }, { status: 400 });
  }
}

// POST: 광고성 정보 수신 재동의 (철회 후 재가입)
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireUserSession();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`account:marketing:${session.id}:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    if (!hasSupabaseServerEnv()) {
      return NextResponse.json({ error: "서버 설정 오류" }, { status: 503 });
    }

    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("users")
      .update({
        marketing_consent_at: now,
        unsubscribed_at: null,
        delivery_email: true,
        updated_at: now
      })
      .eq("id", session.id);

    if (error) {
      console.error("[/api/account/marketing-consent] reconsent failed:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await addSecurityJobLog("account.marketing_reconsent", "success", `user=${session.id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/account/marketing-consent] failed:", error);
    return NextResponse.json({ error: "처리하지 못했습니다." }, { status: 400 });
  }
}
