import { NextRequest, NextResponse } from "next/server";

import { createAdminSession, validateAdminCredentials } from "@/lib/auth/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { adminLoginSchema } from "@/lib/validation/admin";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const limit = checkRateLimit(`admin-login:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      return NextResponse.redirect(new URL("/dashboard/login?error=rate", request.url), 303);
    }

    const formData = await request.formData();
    const payload = adminLoginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password")
    });

    if (!validateAdminCredentials(payload.email, payload.password)) {
      return NextResponse.redirect(new URL("/dashboard/login?error=invalid", request.url), 303);
    }

    await createAdminSession(payload.email);
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/dashboard/login?error=invalid", request.url), 303);
  }
}
