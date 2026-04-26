import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendEmailVerificationCode } from "@/lib/email/verification";
import { findUserByEmail } from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { normalizeEmail } from "@/lib/utils";

const bodySchema = z.object({
  email: z.string().trim().refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "올바른 이메일 주소를 입력해주세요.")
});

// 이메일 가입용 인증번호 발송. POST: 코드 생성+저장+Resend 발송.
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const limit = checkRateLimit(`signup:email-verify:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const body = bodySchema.parse(await request.json());
    const normalized = normalizeEmail(body.email);

    // 이미 가입된 이메일이면 코드 발송 안 하고 안내 (계정 탈취 시도 방지).
    const existing = await findUserByEmail(normalized);
    if (existing) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다. 로그인 화면에서 로그인해주세요." }, { status: 409 });
    }

    const emailLimit = checkRateLimit(`signup:email-verify:email:${normalized}`, 3, 60 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json({ error: "해당 이메일로 인증번호를 너무 자주 요청했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const result = await sendEmailVerificationCode(normalized);
    if (!result.ok) {
      return NextResponse.json({ error: "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "잘못된 입력" }, { status: 400 });
    }
    return NextResponse.json({ error: "처리하지 못했습니다." }, { status: 400 });
  }
}
