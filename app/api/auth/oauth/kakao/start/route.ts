import { NextRequest, NextResponse } from "next/server";

import {
  buildKakaoAuthorizationUrl,
  createKakaoOauthState,
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
    const oauthState = createKakaoOauthState(mode, mode === "signup" ? parseSignupData(request) : undefined);
    const response = NextResponse.redirect(buildKakaoAuthorizationUrl(oauthState.state));
    response.cookies.set(oauthState.cookieName, oauthState.cookieValue, getOauthStateCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "카카오 로그인을 시작하지 못했습니다.";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url));
  }
}
