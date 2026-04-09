import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getServerEnv } from "@/lib/env";
import { findUserByEmail, findUserById } from "@/lib/mongodb/user-data";
import { normalizeEmail } from "@/lib/utils";

const COOKIE_NAME = "slm_user_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function shouldUseSecureCookie() {
  return process.env.NODE_ENV === "production";
}

function sign(payload: string) {
  return createHmac("sha256", getServerEnv().ADMIN_SESSION_SECRET).update(payload).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createUserSession(input: { userId: string; email: string; rememberMe?: boolean }) {
  const expiresAt = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const normalizedEmail = normalizeEmail(input.email);
  const payload = `${input.userId}|${normalizedEmail}|${expiresAt}`;
  const value = `${payload}|${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    ...(input.rememberMe ? { maxAge: MAX_AGE_SECONDS } : {})
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUserSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  const [userId, email, expiresAt, signature] = raw.split("|");
  if (!userId || !email || !expiresAt || !signature) {
    return null;
  }

  if (Number(expiresAt) < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const payload = `${userId}|${email}|${expiresAt}`;
  if (!safeEqual(signature, sign(payload))) {
    return null;
  }

  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  if (normalizeEmail(user.email) !== normalizeEmail(email)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    hasPassword: user.has_password
  };
}

export async function requireUserSession() {
  const session = await getCurrentUserSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function getCurrentUserByEmail(email: string) {
  return findUserByEmail(email);
}
