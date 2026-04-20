import { NextRequest, NextResponse } from "next/server";

import { createUserSession } from "@/lib/auth/user-session";
import {
  fetchKakaoOauthProfile,
  getKakaoStateCookieName,
  getOauthStateCookieOptions,
  verifyKakaoOauthState,
} from "@/lib/auth/kakao-oauth";
import { addSecurityJobLog, cancelAccountDeletion, findUserByEmail } from "@/lib/mongodb/user-data";
import { upsertMongoSignup, sendSignupPreviewEmail } from "@/lib/mongodb/signup";

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

    const verified = verifyKakaoOauthState(request.cookies.get(getKakaoStateCookieName())?.value, state);
    const profile = await fetchKakaoOauthProfile(code);
    const existingUser = await findUserByEmail(profile.email);

    if (existingUser?.is_active || existingUser?.deleted_at) {
      // 가입 모드에서 이미 존재하는 계정이면 로그인하지 않고 안내
      if (verified.mode === "signup") {
        const response = NextResponse.redirect(
          new URL(`/login?error=already-registered&email=${encodeURIComponent(profile.email)}`, request.url),
        );
        clearStateCookie(response);
        return response;
      }
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
      const response = NextResponse.redirect(new URL("/?linked=kakao", request.url));
      clearStateCookie(response);
      return response;
    }

    // 가입 모드 + 관심사 있으면 자동 가입
    if (verified.mode === "signup" && verified.interests.length > 0) {
      const consentedAt = new Date().toISOString();
      const isKakaoChannel = verified.channel === "kakao";
      const user = await upsertMongoSignup({
        email: profile.email,
        deliveryTime: "07:00",
        interests: verified.interests,
        subInterests: verified.subInterests,
        consentedAt,
        marketingConsentedAt: verified.marketingConsent ? consentedAt : null,
        deliveryChannels: { kakao: isKakaoChannel, email: !isKakaoChannel },
        phone: isKakaoChannel ? verified.phone ?? null : null,
        authProvider: "kakao",
      });
      await createUserSession({ userId: user.id, email: profile.email, rememberMe: true });
      await addSecurityJobLog("auth.kakao_signup", "success", `user=${user.id}`);
      try {
        await sendSignupPreviewEmail({ email: profile.email, userId: user.id, interests: verified.interests });
      } catch { /* non-critical */ }
      const response = NextResponse.redirect(new URL("/complete", request.url));
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
