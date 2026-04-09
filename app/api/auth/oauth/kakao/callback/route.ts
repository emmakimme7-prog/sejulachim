import { NextRequest, NextResponse } from "next/server";

import { createUserSession } from "@/lib/auth/user-session";
import {
  fetchKakaoOauthProfile,
  getKakaoStateCookieName,
  getOauthStateCookieOptions,
  verifyKakaoOauthState,
} from "@/lib/auth/kakao-oauth";
import { addSecurityJobLog, cancelAccountDeletion, findUserByEmail } from "@/lib/mongodb/user-data";

function clearStateCookie(response: NextResponse) {
  response.cookies.set(getKakaoStateCookieName(), "", {
    ...getOauthStateCookieOptions(),
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "";
  const code = request.nextUrl.searchParams.get("code") || "";

  try {
    if (!code) {
      throw new Error("카카오 로그인 승인 코드가 없습니다.");
    }

    const mode = verifyKakaoOauthState(request.cookies.get(getKakaoStateCookieName())?.value, state);
    const profile = await fetchKakaoOauthProfile(code);
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
      await addSecurityJobLog("auth.kakao_login", "success", `user=${existingUser.id}`);
      const response = NextResponse.redirect(new URL("/archive", request.url));
      clearStateCookie(response);
      return response;
    }

    await addSecurityJobLog("auth.kakao_signup", "redirected", `email=${profile.email}`);
    const response = NextResponse.redirect(
      new URL(`/signup?email=${encodeURIComponent(profile.email)}&oauth=kakao`, request.url),
    );
    clearStateCookie(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "카카오 로그인에 실패했습니다.";
    const errorCode = message.includes("이메일 제공 동의") ? "kakao-consent" : "kakao";
    const response = NextResponse.redirect(new URL(`/login?error=${errorCode}`, request.url));
    clearStateCookie(response);
    return response;
  }
}
