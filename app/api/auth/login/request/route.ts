import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { createUserSession } from "@/lib/auth/user-session";
import { verifyPassword } from "@/lib/auth/passwords";
import { cancelAccountDeletion, createMagicLinkToken, findUserByEmail, sendMagicLinkEmail, addSecurityJobLog } from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { loginRequestSchema } from "@/lib/validation/auth";
import { normalizeEmail, sanitizePlainText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  let rawEmail = "";
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const limit = checkRateLimit(`auth:login:${ip}`, 8, 60_000);
    if (!limit.allowed) {
      return NextResponse.redirect(new URL("/login?error=rate", request.url), 303);
    }

    const formData = await request.formData();
    rawEmail = String(formData.get("email") ?? "");
    const payload = loginRequestSchema.parse({
      email: rawEmail,
      password: formData.get("password"),
      rememberMe: formData.get("rememberMe") === "on"
    });

    const email = normalizeEmail(payload.email);
    const password = sanitizePlainText(payload.password ?? "", 200);
    const user = await findUserByEmail(email);

    if (!user) {
      await addSecurityJobLog("auth.login_request", "not_found", `email=${email}`);
      return NextResponse.redirect(new URL(`/login?error=not-found&email=${encodeURIComponent(email)}`, request.url), 303);
    }

    if (password) {
      const passwordMatches = Boolean(user.has_password && verifyPassword(password, user.password_hash));
      if (!passwordMatches) {
        await addSecurityJobLog("auth.password_login", "failed", `email=${email}`);
        return NextResponse.redirect(new URL(`/login?error=password&email=${encodeURIComponent(email)}`, request.url), 303);
      }

      // 탈퇴 예약 유저가 재로그인하면 탈퇴 취소
      if (user.deleted_at) {
        await cancelAccountDeletion(user.id);
        await addSecurityJobLog("account.delete_cancel", "success", `user=${user.id}`);
      }

      await createUserSession({ userId: user.id, email: user.email, rememberMe: payload.rememberMe });
      await addSecurityJobLog("auth.password_login", "success", `user=${user.id}`);
      return NextResponse.redirect(new URL("/archive", request.url), 303);
    }

    if (!user.has_password) {
      const token = await createMagicLinkToken(user.id);
      await sendMagicLinkEmail({ email: user.email, token, rememberMe: payload.rememberMe });
      await addSecurityJobLog("auth.magic_link_request", "success", `user=${user.id}`);
    } else {
      await addSecurityJobLog("auth.magic_link_request", "password_required", `user=${user.id}`);
      return NextResponse.redirect(new URL(`/login?error=password&email=${encodeURIComponent(email)}`, request.url), 303);
    }

    return NextResponse.redirect(new URL(`/login?sent=1&email=${encodeURIComponent(email)}`, request.url), 303);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.redirect(new URL(`/login?error=invalid-email&email=${encodeURIComponent(rawEmail)}`, request.url), 303);
    }
    return NextResponse.redirect(new URL("/login?error=password", request.url), 303);
  }
}
