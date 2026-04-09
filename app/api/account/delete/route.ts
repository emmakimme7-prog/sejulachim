import { NextRequest, NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/passwords";
import { clearUserSession, requireUserSession } from "@/lib/auth/user-session";
import { addSecurityJobLog, deleteUserAccount, findUserById } from "@/lib/mongodb/user-data";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { sanitizePlainText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await requireUserSession();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`account-delete:${session.id}:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      return NextResponse.redirect(new URL("/account?error=delete", request.url), 303);
    }

    const formData = await request.formData();
    const user = await findUserById(session.id);

    if (!user) {
      return NextResponse.redirect(new URL("/account?error=delete", request.url), 303);
    }

    // 비밀번호가 있는 유저 → 비밀번호 검증
    if (user.has_password) {
      const password = sanitizePlainText(String(formData.get("password") ?? ""), 200);
      if (!verifyPassword(password, user.password_hash)) {
        await addSecurityJobLog("account.delete", "failed", `user=${session.id}; reason=wrong_password`);
        return NextResponse.redirect(new URL("/account?error=delete", request.url), 303);
      }
    } else {
      // 비밀번호 없는 유저 → "탈퇴합니다" 텍스트 검증
      const confirmText = sanitizePlainText(String(formData.get("confirmText") ?? ""), 20);
      if (confirmText !== "탈퇴합니다") {
        await addSecurityJobLog("account.delete", "failed", `user=${session.id}; reason=confirm_mismatch`);
        return NextResponse.redirect(new URL("/account?error=delete", request.url), 303);
      }
    }

    await deleteUserAccount(session.id);
    await addSecurityJobLog("account.delete", "scheduled", `user=${session.id}; grace=30d`);
    await clearUserSession();
    return NextResponse.redirect(new URL("/?deleted=1", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/account?error=delete", request.url), 303);
  }
}
