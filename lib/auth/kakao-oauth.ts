import "server-only";

import { createHmac, randomBytes } from "node:crypto";

export type SupportedOauthProvider = "kakao" | "google" | "naver";

const STATE_TTL_SECONDS = 60 * 10;

function getEnv(name: string) {
  return String(process.env[name] || "").trim();
}

function getAppUrl() {
  const appUrl = getEnv("APP_URL");
  if (!appUrl) {
    throw new Error("APP_URL 환경변수가 필요합니다.");
  }
  return appUrl.replace(/\/+$/, "");
}

function getKakaoClientId() {
  return getEnv("KAKAO_REST_API_KEY");
}

function getKakaoClientSecret() {
  return getEnv("KAKAO_CLIENT_SECRET");
}

function getGoogleClientId() {
  return getEnv("GOOGLE_CLIENT_ID");
}

function getGoogleClientSecret() {
  return getEnv("GOOGLE_CLIENT_SECRET");
}

function getNaverClientId() {
  return getEnv("NAVER_CLIENT_ID");
}

function getNaverClientSecret() {
  return getEnv("NAVER_CLIENT_SECRET");
}

function getOAuthStateSecret() {
  return getEnv("OAUTH_STATE_SECRET") || getEnv("ADMIN_SESSION_SECRET");
}

function signState(payload: string) {
  const secret = getOAuthStateSecret();
  if (!secret) {
    throw new Error("OAUTH_STATE_SECRET 또는 ADMIN_SESSION_SECRET 환경변수가 필요합니다.");
  }
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function getStateCookieName(provider: SupportedOauthProvider) {
  return `slm_${provider}_oauth_state`;
}

export function isKakaoOauthConfigured() {
  return Boolean(getKakaoClientId() && getKakaoClientSecret());
}

export function isGoogleOauthConfigured() {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

export function isNaverOauthConfigured() {
  return Boolean(getNaverClientId() && getNaverClientSecret());
}

export function getKakaoOauthStartPath(mode: "login" | "signup" = "login") {
  return `/api/auth/oauth/kakao/start?mode=${mode}`;
}

export function getGoogleOauthStartPath(mode: "login" | "signup" = "login") {
  return `/api/auth/oauth/google/start?mode=${mode}`;
}

export function getNaverOauthStartPath(mode: "login" | "signup" = "login") {
  return `/api/auth/oauth/naver/start?mode=${mode}`;
}

export type OauthSignupData = {
  interests?: string[];
  subInterests?: Record<string, string>;
  marketingConsent?: boolean;
};

function createOauthState(provider: SupportedOauthProvider, mode: "login" | "signup", signupData?: OauthSignupData) {
  const state = randomBytes(24).toString("hex");
  const payload = `${provider}:${mode}:${state}`;
  return {
    cookieName: getStateCookieName(provider),
    cookieValue: JSON.stringify({
      provider,
      mode,
      state,
      signature: signState(payload),
      ...(signupData?.interests ? { interests: signupData.interests } : {}),
      ...(signupData?.subInterests ? { subInterests: signupData.subInterests } : {}),
      ...(signupData?.marketingConsent !== undefined ? { marketingConsent: signupData.marketingConsent } : {}),
    }),
    state,
  };
}

export function createKakaoOauthState(mode: "login" | "signup", signupData?: OauthSignupData) {
  return createOauthState("kakao", mode, signupData);
}

export function createGoogleOauthState(mode: "login" | "signup", signupData?: OauthSignupData) {
  return createOauthState("google", mode, signupData);
}

export function createNaverOauthState(mode: "login" | "signup", signupData?: OauthSignupData) {
  return createOauthState("naver", mode, signupData);
}

const PROVIDER_LABEL: Record<SupportedOauthProvider, string> = {
  kakao: "카카오",
  google: "구글",
  naver: "네이버",
};

function verifyOauthState(raw: string | undefined, expectedState: string, provider: SupportedOauthProvider) {
  const label = PROVIDER_LABEL[provider];
  if (!raw) {
    throw new Error(`${label} 로그인 상태가 만료되었습니다. 다시 시도해주세요.`);
  }

  let parsed: { provider?: string; mode?: string; state?: string; signature?: string; interests?: string[]; subInterests?: Record<string, string>; marketingConsent?: boolean };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${label} 로그인 상태가 올바르지 않습니다.`);
  }

  const mode = parsed.mode === "signup" ? "signup" : "login";
  const payload = `${provider}:${mode}:${parsed.state || ""}`;
  if (
    parsed.provider !== provider ||
    parsed.state !== expectedState ||
    parsed.signature !== signState(payload)
  ) {
    throw new Error(`${label} 로그인 요청을 검증하지 못했습니다.`);
  }

  return {
    mode,
    interests: Array.isArray(parsed.interests) ? parsed.interests : [],
    subInterests: parsed.subInterests && typeof parsed.subInterests === "object" ? parsed.subInterests : {},
    marketingConsent: parsed.marketingConsent === true,
  };
}

export function verifyKakaoOauthState(raw: string | undefined, expectedState: string) {
  return verifyOauthState(raw, expectedState, "kakao");
}

export function verifyGoogleOauthState(raw: string | undefined, expectedState: string) {
  return verifyOauthState(raw, expectedState, "google");
}

export function verifyNaverOauthState(raw: string | undefined, expectedState: string) {
  return verifyOauthState(raw, expectedState, "naver");
}

function getRedirectUri(provider: SupportedOauthProvider) {
  return `${getAppUrl()}/api/auth/oauth/${provider}/callback`;
}

export function buildKakaoAuthorizationUrl(state: string) {
  const clientId = getKakaoClientId();
  const clientSecret = getKakaoClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("카카오 로그인 설정이 비어 있습니다.");
  }

  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getRedirectUri("kakao"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "account_email");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url;
}

export function buildGoogleAuthorizationUrl(state: string) {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("구글 로그인 설정이 비어 있습니다.");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getRedirectUri("google"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "consent select_account");
  url.searchParams.set("state", state);
  return url;
}

async function exchangeKakaoCode(code: string) {
  const clientId = getKakaoClientId();
  const clientSecret = getKakaoClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("카카오 로그인 설정이 비어 있습니다.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri("kakao"),
    code,
  });

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    throw new Error("카카오 토큰 교환에 실패했습니다.");
  }
  return String(payload.access_token);
}

export async function fetchKakaoOauthProfile(code: string) {
  const accessToken = await exchangeKakaoCode(code);
  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  const email = String(payload?.kakao_account?.email || "").trim().toLowerCase();
  if (!response.ok || !email) {
    throw new Error("카카오 이메일 제공 동의가 필요합니다.");
  }

  return {
    email,
    nickname: String(payload?.kakao_account?.profile?.nickname || "").trim() || email.split("@")[0],
  };
}

async function exchangeGoogleCode(code: string) {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("구글 로그인 설정이 비어 있습니다.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri("google"),
    code,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    throw new Error("구글 토큰 교환에 실패했습니다.");
  }
  return String(payload.access_token);
}

export async function fetchGoogleOauthProfile(code: string) {
  const accessToken = await exchangeGoogleCode(code);
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  const email = String(payload?.email || "").trim().toLowerCase();
  if (!response.ok || !email) {
    throw new Error("구글 계정에서 이메일 정보를 읽지 못했습니다.");
  }

  return {
    email,
    nickname: String(payload?.name || "").trim() || email.split("@")[0],
  };
}

export function buildNaverAuthorizationUrl(state: string) {
  const clientId = getNaverClientId();
  const clientSecret = getNaverClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("네이버 로그인 설정이 비어 있습니다.");
  }

  const url = new URL("https://nid.naver.com/oauth2.0/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getRedirectUri("naver"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("auth_type", "reprompt");
  url.searchParams.set("state", state);
  return url;
}

async function exchangeNaverCode(code: string, state: string) {
  const clientId = getNaverClientId();
  const clientSecret = getNaverClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("네이버 로그인 설정이 비어 있습니다.");
  }

  const url = new URL("https://nid.naver.com/oauth2.0/token");
  url.searchParams.set("grant_type", "authorization_code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("code", code);
  url.searchParams.set("state", state);

  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    throw new Error("네이버 토큰 교환에 실패했습니다.");
  }
  return String(payload.access_token);
}

export async function fetchNaverOauthProfile(code: string, state: string) {
  const accessToken = await exchangeNaverCode(code, state);
  const response = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  const email = String(payload?.response?.email || "").trim().toLowerCase();
  if (!response.ok || !email) {
    throw new Error("네이버 계정에서 이메일 정보를 읽지 못했습니다.");
  }

  return {
    email,
    nickname: String(payload?.response?.nickname || payload?.response?.name || "").trim() || email.split("@")[0],
  };
}

export function getNaverStateCookieName() {
  return getStateCookieName("naver");
}

export function getKakaoStateCookieName() {
  return getStateCookieName("kakao");
}

export function getGoogleStateCookieName() {
  return getStateCookieName("google");
}

export function getOauthStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  };
}
