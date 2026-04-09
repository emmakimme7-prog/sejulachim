import { NextRequest, NextResponse } from "next/server";

import { hashPassword, isStrongEnoughPassword } from "@/lib/auth/passwords";
import { createUserSession } from "@/lib/auth/user-session";
import { addSecurityJobLog, consumePasswordResetToken, updateUserPassword } from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { passwordResetVerifySchema } from "@/lib/validation/auth";
import { sanitizePlainText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const limit = checkRateLimit(`auth:password-reset-verify:${ip}`, 6, 60_000);
    if (!limit.allowed) {
      return NextResponse.redirect(new URL("/reset-password?error=invalid", request.url), 303);
    }

    const formData = await request.formData();
    const payload = passwordResetVerifySchema.parse({
      token: formData.get("token"),
      password: formData.get("password")
    });

    const user = await consumePasswordResetToken(sanitizePlainText(payload.token, 200));
    if (!user) {
      return NextResponse.redirect(new URL("/reset-password?error=invalid", request.url), 303);
    }

    const password = sanitizePlainText(payload.password, 200);
    if (!isStrongEnoughPassword(password, user.email)) {
      return NextResponse.redirect(new URL(`/reset-password?token=${encodeURIComponent(payload.token)}&error=invalid`, request.url), 303);
    }

    await updateUserPassword(user.id, hashPassword(password));
    await addSecurityJobLog("auth.password_reset_verify", "success", `user=${user.id}`);
    await createUserSession({ userId: user.id, email: user.email });
    return NextResponse.redirect(new URL("/account?status=password-reset", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/reset-password?error=invalid", request.url), 303);
  }
}
