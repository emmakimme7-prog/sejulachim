import { NextRequest, NextResponse } from "next/server";

import { createUserSession } from "@/lib/auth/user-session";
import {
  fetchNaverOauthProfile,
  getNaverStateCookieName,
  getOauthStateCookieOptions,
  verifyNaverOauthState,
} from "@/lib/auth/kakao-oauth";
import { addSecurityJobLog, cancelAccountDeletion, findUserByEmail } from "@/lib/mongodb/user-data";

function clearStateCookie(response: NextResponse) {
  response.cookies.set(getNaverStateCookieName(), "", {
    ...getOauthStateCookieOptions(),
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "";
  const code = request.nextUrl.searchParams.get("code") || "";

  try {
    if (!code) {
      throw new Error("네이버 로그인 승인 코드가 없습니다.");
    }

    verifyNaverOauthState(request.cookies.get(getNaverStateCookieName())?.value, state);
    const profile = await fetchNaverOauthProfile(code, state);
    const existingUser = await findUserByEmail(profile.email);

    if (existingUser?.is_active || existingUser?.deleted_at) {
      if (existingUser.deleted_at) {
        await cancelAccountDeletion(existingUser.id);
        await addSecurityJobLog("account.delete_cancel", "success", `user=${existingUser.id}`);
      }
      await createUserSession({
        userId: existingUser.id,
        email: existingUser.email,
        rememberMe: true,
      });
      await addSecurityJobLog("auth.naver_login", "success", `user=${existingUser.id}`);
      const response = NextResponse.redirect(new URL("/?linked=naver", request.url));
      clearStateCookie(response);
      return response;
    }

    await addSecurityJobLog("auth.naver_signup", "redirected", `email=${profile.email}`);
    const response = NextResponse.redirect(
      new URL(`/signup?email=${encodeURIComponent(profile.email)}&oauth=naver`, request.url),
    );
    clearStateCookie(response);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login?error=naver", request.url));
    clearStateCookie(response);
    return response;
  }
}
