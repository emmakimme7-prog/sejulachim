import { NextRequest, NextResponse } from "next/server";

import { requireUserSession } from "@/lib/auth/user-session";
import { addSecurityJobLog, updateUserPreferences } from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { signupPreferencesSchema } from "@/lib/validation/signup";
import { sanitizePlainText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireUserSession();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`account:preferences:${session.id}:${ip}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const body = signupPreferencesSchema.parse(await request.json());
    const sanitizedSubInterests = Object.fromEntries(
      Object.entries(body.subInterests).map(([key, value]) => [key, sanitizePlainText(String(value), 80)])
    );

    await updateUserPreferences({
      userId: session.id,
      interests: body.interests,
      subInterests: sanitizedSubInterests,
      deliveryTime: body.deliveryTime
    });

    await addSecurityJobLog("account.preferences_update", "success", `user=${session.id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/account/preferences] failed:", error);
    const message = error instanceof Error ? error.message : "설정을 저장하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
