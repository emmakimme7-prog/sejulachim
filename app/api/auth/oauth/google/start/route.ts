import { NextRequest, NextResponse } from "next/server";

import {
  buildGoogleAuthorizationUrl,
  createGoogleOauthState,
  getOauthStateCookieOptions,
} from "@/lib/auth/kakao-oauth";

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "login";
    const oauthState = createGoogleOauthState(mode);
    const response = NextResponse.redirect(buildGoogleAuthorizationUrl(oauthState.state));
    response.cookies.set(oauthState.cookieName, oauthState.cookieValue, getOauthStateCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }
}
