import { NextRequest, NextResponse } from "next/server";

import {
  buildGoogleAuthorizationUrl,
  createGoogleOauthState,
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
  const channel: "kakao" | "email" = request.nextUrl.searchParams.get("ch") === "kakao" ? "kakao" : "email";
  const rawPhone = (request.nextUrl.searchParams.get("p") || "").replace(/\D/g, "");
  const phone = /^010\d{8}$/.test(rawPhone) ? rawPhone : null;
  return interests.length ? { interests, subInterests, marketingConsent, channel, phone } : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "login";
    const oauthState = createGoogleOauthState(mode, mode === "signup" ? parseSignupData(request) : undefined);
    const response = NextResponse.redirect(buildGoogleAuthorizationUrl(oauthState.state));
    response.cookies.set(oauthState.cookieName, oauthState.cookieValue, getOauthStateCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }
}
