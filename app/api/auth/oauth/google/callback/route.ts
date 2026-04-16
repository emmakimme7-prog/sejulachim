import { NextRequest, NextResponse } from "next/server";

import { createUserSession } from "@/lib/auth/user-session";
import {
  fetchGoogleOauthProfile,
  getGoogleStateCookieName,
  getOauthStateCookieOptions,
  verifyGoogleOauthState,
} from "@/lib/auth/kakao-oauth";
import { addSecurityJobLog, cancelAccountDeletion, findUserByEmail } from "@/lib/mongodb/user-data";

function clearStateCookie(response: NextResponse) {
  response.cookies.set(getGoogleStateCookieName(), "", {
    ...getOauthStateCookieOptions(),
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "";
  const code = request.nextUrl.searchParams.get("code") || "";

  try {
    if (!code) {
      throw new Error("구글 로그인 승인 코드가 없습니다.");
    }

    verifyGoogleOauthState(request.cookies.get(getGoogleStateCookieName())?.value, state);
    const profile = await fetchGoogleOauthProfile(code);
    const existingUser = await findUserByEmail(profile.email);

    if (existingUser?.is_active || existingUser?.deleted_at) {
      // 탈퇴 예약 유저가 재로그인하면 탈퇴 취소
      if (existingUser.deleted_at) {
        await cancelAccountDeletion(existingUser.id);
        await addSecurityJobLog("account.delete_cancel", "success", `user=${existingUser.id}`);
      }
      await createUserSession({
        userId: existingUser.id,
        email: existingUser.email,
        rememberMe: true,
      });
      await addSecurityJobLog("auth.google_login", "success", `user=${existingUser.id}`);
      const response = NextResponse.redirect(new URL("/?linked=google", request.url));
      clearStateCookie(response);
      return response;
    }

    await addSecurityJobLog("auth.google_signup", "redirected", `email=${profile.email}`);
    const response = NextResponse.redirect(
      new URL(`/signup?email=${encodeURIComponent(profile.email)}&oauth=google`, request.url),
    );
    clearStateCookie(response);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login?error=google", request.url));
    clearStateCookie(response);
    return response;
  }
}
