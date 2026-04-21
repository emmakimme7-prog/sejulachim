import "server-only";

import { createHash, randomInt } from "node:crypto";
import { Resend } from "resend";

import { getServerEnv, hasSupabaseServerEnv } from "@/lib/env";
import { getBrandedFromEmail } from "@/lib/email/brand";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashCode(code: string, email: string) {
  // email 을 salt 로 포함 (동일 코드 타 계정 대조 공격 방지).
  return createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");
}

type SendResult = { ok: true } | { ok: false; reason: string };

export async function sendEmailVerificationCode(email: string): Promise<SendResult> {
  if (!hasSupabaseServerEnv()) return { ok: false, reason: "SUPABASE_ENV_MISSING" };
  const env = getServerEnv();
  const supabase = createAdminSupabaseClient();
  const normalized = email.trim().toLowerCase();
  const code = generateCode();
  const codeHash = hashCode(code, normalized);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  // 만료되지 않은 이전 코드 무효화
  await supabase
    .from("email_signup_verifications")
    .update({ used_at: new Date().toISOString() })
    .eq("email", normalized)
    .is("used_at", null);

  const { error: insertError } = await supabase
    .from("email_signup_verifications")
    .insert({
      email: normalized,
      code_hash: codeHash,
      expires_at: expiresAt
    });
  if (insertError) {
    console.warn("[email-verification] insert failed", insertError.message);
    return { ok: false, reason: "INSERT_FAILED" };
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from: getBrandedFromEmail(),
      to: normalized,
      subject: "세줄아침 이메일 인증번호",
      html: renderVerificationEmail(code)
    });
    if (response.error) {
      console.warn("[email-verification] resend failed", response.error.message);
      return { ok: false, reason: "SEND_FAILED" };
    }
  } catch (error) {
    console.warn("[email-verification] resend exception", (error as Error).message);
    return { ok: false, reason: "SEND_EXCEPTION" };
  }

  return { ok: true };
}

export async function verifyEmailVerificationCode(email: string, code: string): Promise<SendResult> {
  if (!hasSupabaseServerEnv()) return { ok: false, reason: "SUPABASE_ENV_MISSING" };
  const supabase = createAdminSupabaseClient();
  const normalized = email.trim().toLowerCase();
  const codeHash = hashCode(code, normalized);

  const { data: record } = await supabase
    .from("email_signup_verifications")
    .select("id, code_hash, expires_at, attempts, used_at")
    .eq("email", normalized)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) return { ok: false, reason: "NOT_FOUND" };
  if (new Date(record.expires_at).getTime() < Date.now()) return { ok: false, reason: "EXPIRED" };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "TOO_MANY_ATTEMPTS" };

  if (record.code_hash !== codeHash) {
    await supabase
      .from("email_signup_verifications")
      .update({ attempts: record.attempts + 1 })
      .eq("id", record.id);
    return { ok: false, reason: "MISMATCH" };
  }

  await supabase
    .from("email_signup_verifications")
    .update({ used_at: new Date().toISOString() })
    .eq("id", record.id);
  return { ok: true };
}

function renderVerificationEmail(code: string) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>세줄아침 이메일 인증번호</title>
</head>
<body style="margin:0; padding:40px 20px; background:#F0EEE9; font-family:-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;">
  <div style="max-width:520px; margin:0 auto; background:#FFFBF5; border:1.5px solid #F2E6D7; border-radius:20px; padding:36px 28px;">
    <h1 style="margin:0 0 16px; font-size:22px; font-weight:900; color:#1F1A14; letter-spacing:-0.02em;">
      세줄아침 이메일 인증
    </h1>
    <p style="margin:0 0 22px; font-size:15px; color:#4A4037; line-height:1.7;">
      아래 6자리 인증번호를 회원가입 화면에 입력해주세요.
      <br />
      인증번호는 ${CODE_TTL_MINUTES}분 동안만 유효합니다.
    </p>
    <div style="padding:22px 24px; background:#FFF2E3; border:1.5px solid #FFD1A3; border-radius:14px; text-align:center;">
      <div style="font-size:34px; font-weight:900; color:#B2570F; letter-spacing:0.4em; font-variant-numeric:tabular-nums;">
        ${code}
      </div>
    </div>
    <p style="margin:22px 0 0; font-size:12px; color:#7A6F62; line-height:1.6;">
      본 메일을 요청하지 않으셨다면 무시하셔도 됩니다.
      <br />
      문의: hello@studiobyyou.kr
    </p>
  </div>
</body>
</html>`;
}
