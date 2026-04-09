import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  addSecurityJobLog,
  createPasswordResetToken,
  findUserByEmail,
  sendPasswordResetEmail
} from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { passwordResetRequestSchema } from "@/lib/validation/auth";
import { normalizeEmail } from "@/lib/utils";

export async function POST(request: NextRequest) {
  let rawEmail = "";
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const limit = checkRateLimit(`auth:password-reset-request:${ip}`, 6, 60_000);
    if (!limit.allowed) {
      return NextResponse.redirect(new URL("/reset-password?sent=1", request.url), 303);
    }

    const formData = await request.formData();
    rawEmail = String(formData.get("email") ?? "");
    const payload = passwordResetRequestSchema.parse({
      email: rawEmail
    });

    const email = normalizeEmail(payload.email);
    const user = await findUserByEmail(email);
    if (!user) {
      await addSecurityJobLog("auth.password_reset_request", "not_found", `email=${email}`);
      return NextResponse.redirect(new URL(`/reset-password?error=not-found&email=${encodeURIComponent(email)}`, request.url), 303);
    }

    if (user.has_password) {
      const token = await createPasswordResetToken(user.id);
      await sendPasswordResetEmail({ email: user.email, token });
      await addSecurityJobLog("auth.password_reset_request", "success", `user=${user.id}`);
    } else {
      await addSecurityJobLog("auth.password_reset_request", "no_password", `user=${user.id}`);
      return NextResponse.redirect(new URL(`/reset-password?error=no-password&email=${encodeURIComponent(email)}`, request.url), 303);
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.redirect(new URL(`/reset-password?error=invalid-email&email=${encodeURIComponent(rawEmail)}`, request.url), 303);
    }
    return NextResponse.redirect(new URL("/reset-password?error=invalid", request.url), 303);
  }

  return NextResponse.redirect(new URL("/reset-password?sent=1", request.url), 303);
}
