import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { getAdminAllowlist, getServerEnv } from "@/lib/env";
import { normalizeEmail } from "@/lib/utils";

const COOKIE_NAME = "slm_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function shouldUseSecureCookie() {
  return process.env.NODE_ENV === "production";
}

function sign(payload: string) {
  const secret = getServerEnv().ADMIN_SESSION_SECRET;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function createAdminSession(email: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const normalizedEmail = normalizeEmail(email);
  const payload = `${normalizedEmail}|${expiresAt}`;
  const value = `${payload}|${sign(payload)}`;
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: MAX_AGE_SECONDS
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0
  });
}

export async function getAdminSessionEmail() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [email, expiresAt, signature] = raw.split("|");
  if (!email || !expiresAt || !signature) return null;
  if (Number(expiresAt) < Math.floor(Date.now() / 1000)) return null;

  const payload = `${email}|${expiresAt}`;
  if (!safeEqual(signature, sign(payload))) return null;
  if (!getAdminAllowlist().includes(email)) return null;

  return email;
}

export async function requireAdmin() {
  const email = await getAdminSessionEmail();
  if (!email) {
    redirect("/dashboard/login");
  }
  return email;
}

export async function assertAdminRequest() {
  const email = await getAdminSessionEmail();
  if (!email) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
  return email;
}

export function validateAdminCredentials(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const env = getServerEnv();
  // ADMIN_PASSWORD는 env 스키마에서 min(12)로 필수값이지만, 방어적으로 재확인
  if (!env.ADMIN_PASSWORD) return false;
  const allowlisted = getAdminAllowlist().includes(normalizedEmail);
  const passwordMatches = safeEqual(password, env.ADMIN_PASSWORD);

  return allowlisted && passwordMatches;
}

export function isAdminRequestPath(request: NextRequest) {
  return request.nextUrl.pathname.startsWith("/dashboard");
}
