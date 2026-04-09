import { NextRequest, NextResponse } from "next/server";

import { hashPassword, isStrongEnoughPassword } from "@/lib/auth/passwords";
import { requireUserSession } from "@/lib/auth/user-session";
import { addSecurityJobLog, findUserById, updateUserPassword } from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { passwordSetupSchema } from "@/lib/validation/auth";
import { sanitizePlainText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireUserSession();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`auth:password-set:${session.id}:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      return NextResponse.redirect(new URL("/account?error=weak", request.url), 303);
    }

    const formData = await request.formData();
    const payload = passwordSetupSchema.parse({
      password: formData.get("password")
    });

    const user = await findUserById(session.id);
    if (!user || user.has_password) {
      return NextResponse.redirect(new URL("/account", request.url), 303);
    }

    const password = sanitizePlainText(payload.password, 200);
    if (!isStrongEnoughPassword(password, user.email)) {
      return NextResponse.redirect(new URL("/account?error=weak", request.url), 303);
    }

    await updateUserPassword(user.id, hashPassword(password));
    await addSecurityJobLog("auth.password_set", "success", `user=${user.id}`);
    return NextResponse.redirect(new URL("/account?status=password-set", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/account?error=weak", request.url), 303);
  }
}
