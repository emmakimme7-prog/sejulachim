import { NextRequest, NextResponse } from "next/server";

import {
  buildKakaoAuthorizationUrl,
  createKakaoOauthState,
  getOauthStateCookieOptions,
} from "@/lib/auth/kakao-oauth";

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "login";
    const oauthState = createKakaoOauthState(mode);
    const response = NextResponse.redirect(buildKakaoAuthorizationUrl(oauthState.state));
    response.cookies.set(oauthState.cookieName, oauthState.cookieValue, getOauthStateCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "카카오 로그인을 시작하지 못했습니다.";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url));
  }
}
