import { NextRequest, NextResponse } from "next/server";

import { createUserSession } from "@/lib/auth/user-session";
import {
  fetchGoogleOauthProfile,
  getGoogleStateCookieName,
  getOauthStateCookieOptions,
  verifyGoogleOauthState,
} from "@/lib/auth/kakao-oauth";
import { addSecurityJobLog, cancelAccountDeletion, findUserByEmail } from "@/lib/mongodb/user-data";
import { upsertMongoSignup, sendSignupPreviewEmail } from "@/lib/mongodb/signup";

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

    const verified = verifyGoogleOauthState(request.cookies.get(getGoogleStateCookieName())?.value, state);
    const profile = await fetchGoogleOauthProfile(code);
    const existingUser = await findUserByEmail(profile.email);

    if (existingUser?.is_active || existingUser?.deleted_at) {
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
      await addSecurityJobLog("auth.google_login", "success", `user=${existingUser.id}`);
      const response = NextResponse.redirect(new URL("/?linked=google", request.url));
      clearStateCookie(response);
      return response;
    }

    if (verified.mode === "signup" && verified.interests.length > 0) {
      const consentedAt = new Date().toISOString();
      const user = await upsertMongoSignup({
        email: profile.email,
        deliveryTime: "07:00",
        interests: verified.interests,
        subInterests: verified.subInterests,
        consentedAt,
        marketingConsentedAt: verified.marketingConsent ? consentedAt : null,
        authProvider: "google",
      });
      await createUserSession({ userId: user.id, email: profile.email, rememberMe: true });
      await addSecurityJobLog("auth.google_signup", "success", `user=${user.id}`);
      try {
        await sendSignupPreviewEmail({ email: profile.email, userId: user.id, interests: verified.interests });
      } catch { /* non-critical */ }
      const response = NextResponse.redirect(new URL("/complete", request.url));
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
