import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { Notice } from "@/components/ui/notice";
import { isGoogleOauthConfigured, isKakaoOauthConfigured, isNaverOauthConfigured } from "@/lib/auth/kakao-oauth";
import { getCurrentUserSession } from "@/lib/auth/user-session";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: true },
};

type PageProps = {
  searchParams: Promise<{ sent?: string; error?: string; reset?: string; verified?: string; email?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  password: "비밀번호가 일치하지 않거나 비밀번호 로그인이 필요한 계정입니다.",
  "not-found": "아직 가입되지 않은 이메일입니다. 먼저 무료 소식 받기에서 신청해주세요.",
  "invalid-email": "유효한 이메일 주소를 입력해주세요.",
  expired: "로그인 링크가 만료되었거나 이미 사용되었습니다.",
  "kakao-consent": "카카오 로그인 시 이메일 제공 동의가 필요합니다.",
  kakao: "카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.",
  google: "구글 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.",
  naver: "네이버 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.",
};

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getCurrentUserSession();
  const { sent, error, reset, verified, email } = await searchParams;
  const kakaoEnabled = isKakaoOauthConfigured();
  const googleEnabled = isGoogleOauthConfigured();
  const naverEnabled = isNaverOauthConfigured();

  if (session && !verified) {
    redirect("/archive");
  }

  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "40px 20px 60px" }}>
      <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 24px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "#fff",
            borderRadius: 999,
            border: "2px solid #F5DDC2",
            fontSize: 13,
            fontWeight: 700,
            color: "#B2570F",
            marginBottom: 16,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#E57C23" }} />
          로그인
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          다시 만나서 반가워요
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
          이메일만 입력하셔도 로그인 링크를 보내드려요.
        </p>
      </div>

      {sent ? (
        <div style={{ maxWidth: 560, margin: "0 auto 16px" }}>
          <Notice tone="success">입력하신 이메일로 안내를 보냈습니다</Notice>
        </div>
      ) : null}
      {reset ? (
        <div style={{ maxWidth: 560, margin: "0 auto 16px" }}>
          <Notice tone="success">비밀번호가 바뀌었습니다. 새 비밀번호로 로그인해보세요.</Notice>
        </div>
      ) : null}
      {error === "already-registered" ? (
        <div style={{ maxWidth: 560, margin: "0 auto 16px" }}>
          <Notice tone="info">이미 가입된 계정입니다. 아래에서 로그인해주세요.</Notice>
        </div>
      ) : null}
      {error && ERROR_MESSAGES[error] ? (
        <div style={{ maxWidth: 560, margin: "0 auto 16px" }}>
          <Notice tone="error">{ERROR_MESSAGES[error]}</Notice>
        </div>
      ) : null}

      {verified && session && !session.hasPassword ? (
        <div
          style={{
            maxWidth: 560,
            margin: "0 auto 16px",
            background: "#fff",
            borderRadius: 20,
            border: "1.5px solid #F2E6D7",
            padding: 22,
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.02em" }}>
            이메일 확인 완료!
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
            다음부터 이메일 확인 없이 로그인하시려면 비밀번호를 설정해 주세요.
          </p>
          <form method="post" action="/api/auth/password/set">
            <label style={{ display: "block", fontSize: 14, fontWeight: 800, color: "#1F1A14", marginBottom: 8 }}>
              새 비밀번호 (8자 이상)
            </label>
            <input
              type="password"
              name="password"
              minLength={8}
              autoComplete="new-password"
              required
              style={{
                width: "100%",
                minHeight: 56,
                padding: "0 16px",
                background: "#FFFBF5",
                border: "2px solid #E8DCC7",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: "#1F1A14",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                marginBottom: 14,
              }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="submit"
                style={{
                  flex: "1 1 200px",
                  minHeight: 52,
                  background: "#E57C23",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                비밀번호 설정하기
              </button>
              <Link
                href="/"
                style={{
                  flex: "1 1 150px",
                  minHeight: 52,
                  background: "#fff",
                  color: "#4A4037",
                  border: "1.5px solid #E8DCC7",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 800,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                다음에 설정하기
              </Link>
            </div>
          </form>
        </div>
      ) : null}

      <LoginForm
        defaultEmail={email ?? ""}
        defaultRememberMe={false}
        kakaoEnabled={kakaoEnabled}
        googleEnabled={googleEnabled}
        naverEnabled={naverEnabled}
      />

      <div
        style={{
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: 20,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        <Link
          href="/reset-password"
          style={{ color: "#7A6F62", textDecoration: "underline", textUnderlineOffset: 4 }}
        >
          비밀번호 재설정
        </Link>
        <Link
          href="/signup"
          style={{ color: "#E57C23", textDecoration: "underline", textUnderlineOffset: 4, fontWeight: 800 }}
        >
          아직 가입하지 않으셨나요?
        </Link>
      </div>
    </div>
  );
}
