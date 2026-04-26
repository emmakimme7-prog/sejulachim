import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ApiUnauthorizedError, requireApiUserSession } from "@/lib/auth/user-session";
import { hasSupabaseServerEnv } from "@/lib/env";
import { addSecurityJobLog } from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/utils";

const deliverySchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(320)
      .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "유효한 이메일 주소를 입력해주세요.")
      .nullable()
      .optional(),
    deliveryChannels: z.object({
      email: z.boolean()
    })
  })
  .superRefine((value, ctx) => {
    if (value.deliveryChannels.email && !value.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "이메일로 받으려면 이메일 주소가 필요합니다." });
    }
  });

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUserSession();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`account:delivery:${session.id}:${ip}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const body = deliverySchema.parse(await request.json());

    if (!hasSupabaseServerEnv()) {
      return NextResponse.json({ error: "서버 설정 오류로 저장하지 못했습니다." }, { status: 503 });
    }

    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      phone: null,
      delivery_kakao: false,
      delivery_email: body.deliveryChannels.email,
      updated_at: now
    };
    // 이메일 채널 ON 이면 계정 이메일도 동기화 (사용자가 다른 메일로 받고 싶다고 명시한 경우)
    if (body.deliveryChannels.email && body.email) {
      patch.email = normalizeEmail(body.email);
    }

    const { error } = await supabase.from('sj_users').update(patch).eq("id", session.id);
    if (error) {
      console.error("[/api/account/delivery] update failed:", error);
      await addSecurityJobLog("account.delivery_update", "failed", `user=${session.id}; ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await addSecurityJobLog("account.delivery_update", "success", `user=${session.id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiUnauthorizedError) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력값을 다시 확인해주세요." }, { status: 400 });
    }
    console.error("[/api/account/delivery] failed:", error);
    return NextResponse.json({ error: "저장하지 못했습니다." }, { status: 400 });
  }
}
