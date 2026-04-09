import { NextRequest, NextResponse } from "next/server";

import { createUserSession } from "@/lib/auth/user-session";
import { addSecurityJobLog, cancelAccountDeletion, consumeMagicLinkToken } from "@/lib/mongodb/user-data";
import { sanitizePlainText } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const token = sanitizePlainText(request.nextUrl.searchParams.get("token") ?? "", 200);
  const purpose = request.nextUrl.searchParams.get("purpose");
  const rememberMe = request.nextUrl.searchParams.get("remember") === "1";

  if (!token || purpose !== "login") {
    return NextResponse.redirect(new URL("/login?error=expired", request.url), 303);
  }

  const user = await consumeMagicLinkToken(token);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=expired", request.url), 303);
  }

  // 탈퇴 예약 유저가 재로그인하면 탈퇴 취소
  if (user.deleted_at) {
    await cancelAccountDeletion(user.id);
    await addSecurityJobLog("account.delete_cancel", "success", `user=${user.id}`);
  }

  await createUserSession({ userId: user.id, email: user.email, rememberMe });
  return NextResponse.redirect(
    new URL(user.has_password ? "/archive" : "/login?verified=1", request.url),
    303
  );
}
