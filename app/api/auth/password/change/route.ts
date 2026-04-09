import { NextRequest, NextResponse } from "next/server";

import { hashPassword, isStrongEnoughPassword, verifyPassword } from "@/lib/auth/passwords";
import { requireUserSession } from "@/lib/auth/user-session";
import { addSecurityJobLog, findUserById, updateUserPassword } from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { passwordChangeSchema } from "@/lib/validation/auth";
import { sanitizePlainText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireUserSession();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`auth:password-change:${session.id}:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      return NextResponse.redirect(new URL("/account?error=password", request.url), 303);
    }

    const formData = await request.formData();
    const payload = passwordChangeSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword")
    });

    const user = await findUserById(session.id);
    if (!user?.has_password || !verifyPassword(sanitizePlainText(payload.currentPassword, 200), user.password_hash)) {
      await addSecurityJobLog("auth.password_change", "failed", `user=${session.id}`);
      return NextResponse.redirect(new URL("/account?error=password", request.url), 303);
    }

    const newPassword = sanitizePlainText(payload.newPassword, 200);
    if (!isStrongEnoughPassword(newPassword, user.email)) {
      return NextResponse.redirect(new URL("/account?error=weak", request.url), 303);
    }

    await updateUserPassword(user.id, hashPassword(newPassword));
    await addSecurityJobLog("auth.password_change", "success", `user=${user.id}`);
    return NextResponse.redirect(new URL("/account?status=password-changed", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/account?error=password", request.url), 303);
  }
}
