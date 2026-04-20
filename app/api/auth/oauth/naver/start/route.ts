import { NextRequest, NextResponse } from "next/server";

import {
  buildNaverAuthorizationUrl,
  createNaverOauthState,
  getOauthStateCookieOptions,
} from "@/lib/auth/kakao-oauth";

function parseSignupData(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("interests") || "";
  const interests = raw.split(",").map(s => s.trim()).filter(Boolean);
  const subRaw = request.nextUrl.searchParams.get("sub");
  let subInterests: Record<string, string> = {};
  if (subRaw) {
    try { subInterests = JSON.parse(subRaw); } catch { /* ignore */ }
  }
  const marketingConsent = request.nextUrl.searchParams.get("m") === "1";
  return interests.length ? { interests, subInterests, marketingConsent } : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "login";
    const oauthState = createNaverOauthState(mode, mode === "signup" ? parseSignupData(request) : undefined);
    const response = NextResponse.redirect(buildNaverAuthorizationUrl(oauthState.state));
    response.cookies.set(oauthState.cookieName, oauthState.cookieValue, getOauthStateCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.redirect(new URL("/login?error=naver", request.url));
  }
}
