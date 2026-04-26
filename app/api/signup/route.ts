import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { isStrongEnoughPassword } from "@/lib/auth/passwords";
import { createUserSession } from "@/lib/auth/user-session";
import { verifyEmailVerificationCode } from "@/lib/email/verification";
import { hasSupabaseServerEnv } from "@/lib/env";
import { addSecurityJobLog, findUserByEmail } from "@/lib/mongodb/user-data";
import { sendSignupPreviewEmail, upsertMongoSignup } from "@/lib/mongodb/signup";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { signupSchema } from "@/lib/validation/signup";
import { normalizeEmail, sanitizePlainText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const limit = checkRateLimit(`signup:${ip}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const body = signupSchema.parse(await request.json());
    const normalizedEmail = normalizeEmail(body.email);
    const consentedAt = new Date().toISOString();
    const password = body.passwordEnabled ? sanitizePlainText(body.password ?? "", 200) : "";

    if (body.passwordEnabled && !isStrongEnoughPassword(password, normalizedEmail)) {
      return NextResponse.json({ error: "비밀번호 규칙을 확인해 주세요." }, { status: 400 });
    }

    // 이메일 직접 가입은 6자리 인증번호 필수.
    if (!body.verificationCode) {
      return NextResponse.json({ error: "이메일 인증번호를 입력해주세요." }, { status: 400 });
    }
    const verifyResult = await verifyEmailVerificationCode(normalizedEmail, body.verificationCode);
    if (!verifyResult.ok) {
      const message =
        verifyResult.reason === "EXPIRED"
          ? "인증번호가 만료되었습니다. 다시 요청해주세요."
          : verifyResult.reason === "TOO_MANY_ATTEMPTS"
          ? "시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요."
          : verifyResult.reason === "MISMATCH"
          ? "인증번호가 일치하지 않습니다."
          : "인증번호 확인에 실패했습니다. 다시 요청해주세요.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!hasSupabaseServerEnv()) {
      return NextResponse.json({ ok: true, mode: "demo" });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json({ error: "이미 신청된 이메일입니다. 로그인 후 설정을 변경해주세요." }, { status: 409 });
    }

    const sanitizedSubInterests = Object.fromEntries(
      Object.entries(body.subInterests).map(([key, value]) => [key, sanitizePlainText(String(value), 80)])
    );
    const user = await upsertMongoSignup({
      email: normalizedEmail,
      deliveryTime: body.deliveryTime,
      interests: body.interests,
      subInterests: sanitizedSubInterests,
      consentedAt,
      marketingConsentedAt: body.agreeToMarketing ? consentedAt : null,
      password: password || undefined,
      phone: null,
      deliveryChannels: body.deliveryChannels ?? { email: true }
    });

    const channelEmail = body.deliveryChannels?.email ?? true;
    if (channelEmail) {
      try {
        await sendSignupPreviewEmail({
          email: normalizedEmail,
          userId: user.id,
          interests: body.interests
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown";
        await addSecurityJobLog("signup.preview_email", "failed", `user=${user.id}; error=${message}`);
      }
    }

    // 가입 완료 후 자동 로그인 — 세션 쿠키 발급
    try {
      await createUserSession({
        userId: user.id,
        email: normalizedEmail,
        rememberMe: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      await addSecurityJobLog("signup.auto_session", "failed", `user=${user.id}; error=${message}`);
      // 세션 발급 실패해도 가입 자체는 성공 응답 (사용자가 수동 로그인 가능)
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력값을 다시 확인해주세요." }, { status: 400 });
    }

    return NextResponse.json({ error: "신청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 400 });
  }
}
