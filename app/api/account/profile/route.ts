import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { ApiUnauthorizedError, requireApiUserSession } from "@/lib/auth/user-session";
import { updateUserProfile } from "@/lib/mongodb/user-data";
import { accountProfileSchema } from "@/lib/validation/account";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { sanitizePlainText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUserSession();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`account:profile:${session.id}:${ip}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const body = accountProfileSchema.parse(await request.json());
    await updateUserProfile({
      userId: session.id,
      nickname: sanitizePlainText(body.nickname, 24),
      avatarKey: body.avatarKey,
      avatarDataUrl: body.avatarDataUrl || undefined,
      fontSize: body.fontSize
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiUnauthorizedError) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "프로필 입력값을 다시 확인해주세요.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: "프로필을 저장하지 못했습니다." }, { status: 400 });
  }
}
