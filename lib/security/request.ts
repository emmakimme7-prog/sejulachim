import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

import { getOptionalServerEnv } from "@/lib/env";

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    throw new Error("INVALID_ORIGIN");
  }

  const env = getOptionalServerEnv();
  const requestHost = new URL(origin).host;
  const allowedHosts = new Set<string>([request.nextUrl.host]);

  if (env.APP_URL) {
    allowedHosts.add(new URL(env.APP_URL).host);
  }

  if (!allowedHosts.has(requestHost)) {
    throw new Error("INVALID_ORIGIN");
  }
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function secureCompareSecret(input: string | null, expected: string) {
  if (!input || !expected) return false;
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAuthorizedCronRequest(request: NextRequest, expectedSecret: string) {
  if (!expectedSecret) {
    return false;
  }
  const authorization = request.headers.get("authorization");
  const manualHeader = request.headers.get("x-cron-secret");

  return (
    secureCompareSecret(authorization, `Bearer ${expectedSecret}`) ||
    secureCompareSecret(manualHeader, expectedSecret)
  );
}
