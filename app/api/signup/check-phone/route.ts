import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabaseServerEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  phone: z.string().trim().regex(/^010\d{8}$/u, "휴대폰번호 형식이 올바르지 않습니다.")
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const limit = checkRateLimit(`signup:check-phone:${ip}`, 30, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
    }

    const body = bodySchema.parse(await request.json());
    if (!hasSupabaseServerEnv()) {
      return NextResponse.json({ available: true });
    }

    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("phone", body.phone)
      .is("unsubscribed_at", null)
      .maybeSingle();

    return NextResponse.json({ available: !data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "잘못된 입력" }, { status: 400 });
    }
    return NextResponse.json({ error: "확인에 실패했습니다." }, { status: 400 });
  }
}
