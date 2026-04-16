import { NextRequest, NextResponse } from "next/server";

import {
  buildNaverAuthorizationUrl,
  createNaverOauthState,
  getOauthStateCookieOptions,
} from "@/lib/auth/kakao-oauth";

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "login";
    const oauthState = createNaverOauthState(mode);
    const response = NextResponse.redirect(buildNaverAuthorizationUrl(oauthState.state));
    response.cookies.set(oauthState.cookieName, oauthState.cookieValue, getOauthStateCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.redirect(new URL("/login?error=naver", request.url));
  }
}
