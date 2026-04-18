import type { Metadata } from "next";

import { Notice } from "@/components/ui/notice";
import { ResetPasswordRequestForm } from "@/components/reset-password-request-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ token?: string; sent?: string; error?: string; email?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  "not-found": "아직 가입되지 않은 이메일입니다. 먼저 무료 소식 받기에서 신청해주세요.",
  "no-password": "이 계정은 비밀번호가 아직 없습니다. 이메일 로그인 링크로 먼저 로그인해주세요.",
  "invalid-email": "유효한 이메일 주소를 입력해주세요.",
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token, sent, error, email } = await searchParams;

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
          비밀번호 재설정
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          비밀번호 재설정
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
          {token ? "새 비밀번호를 입력해주세요." : "가입하신 이메일을 입력하시면 재설정 링크를 보내드려요."}
        </p>
      </div>

      {sent ? (
        <div style={{ maxWidth: 560, margin: "0 auto 16px" }}>
          <Notice tone="success">입력하신 이메일로 안내를 보냈습니다</Notice>
        </div>
      ) : null}
      {error && ERROR_MESSAGES[error] ? (
        <div style={{ maxWidth: 560, margin: "0 auto 16px" }}>
          <Notice tone="error">{ERROR_MESSAGES[error]}</Notice>
        </div>
      ) : error ? (
        <div style={{ maxWidth: 560, margin: "0 auto 16px" }}>
          <Notice tone="error">링크가 만료되었거나 사용할 수 없습니다.</Notice>
        </div>
      ) : null}

      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "#FFFBF5",
          borderRadius: 24,
          padding: "28px 22px",
          border: "1.5px solid #F2E6D7",
        }}
      >
        {token ? (
          <form method="post" action="/api/auth/password/reset/verify">
            <input type="hidden" name="token" value={token} />
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 800,
                color: "#1F1A14",
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}
            >
              새 비밀번호 (8자 이상)
            </label>
            <input
              type="password"
              name="password"
              minLength={8}
              required
              autoComplete="new-password"
              style={{
                width: "100%",
                minHeight: 60,
                padding: "0 18px",
                background: "#fff",
                border: "2px solid #E8DCC7",
                borderRadius: 14,
                fontSize: 17,
                fontWeight: 600,
                color: "#1F1A14",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                marginBottom: 20,
              }}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                minHeight: 60,
                background: "#E57C23",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: "-0.01em",
                boxShadow: "0 6px 16px rgba(229, 124, 35, 0.35)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              비밀번호 재설정
            </button>
          </form>
        ) : (
          <ResetPasswordRequestForm defaultEmail={email ?? ""} />
        )}
      </div>
    </div>
  );
}
