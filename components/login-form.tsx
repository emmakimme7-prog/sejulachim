"use client";

import { useMemo, useState } from "react";

function KakaoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#3C1E1E" aria-hidden="true">
      <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.72 1.74 5.12 4.39 6.51l-.9 3.3c-.08.29.23.52.48.37l3.93-2.6c.69.09 1.39.14 2.1.14 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
    </svg>
  );
}

function GoogleMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export function LoginForm({
  defaultEmail = "",
  defaultRememberMe = false,
  kakaoEnabled = false,
  googleEnabled = false,
  naverEnabled = false,
}: {
  defaultEmail?: string;
  defaultRememberMe?: boolean;
  kakaoEnabled?: boolean;
  googleEnabled?: boolean;
  naverEnabled?: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(defaultRememberMe);

  const buttonLabel = useMemo(
    () => (password.trim().length > 0 ? "로그인" : "이메일로 로그인 링크 보내기"),
    [password]
  );

  const hasSocial = kakaoEnabled || naverEnabled || googleEnabled;

  return (
    <div
      style={{
        background: "#FFFBF5",
        borderRadius: 24,
        padding: "28px 22px 40px",
        border: "1.5px solid #F2E6D7",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: 26,
          fontWeight: 900,
          color: "#1F1A14",
          letterSpacing: "-0.03em",
          lineHeight: 1.3,
        }}
      >
        어떻게 로그인할까요?
      </h1>
      <p style={{ margin: "0 0 22px", fontSize: 15, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
        가입하신 방법으로 로그인해 주세요.
      </p>

      {/* 소셜 로그인 */}
      {hasSocial ? (
        <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
          {kakaoEnabled ? (
            <a
              href="/api/auth/oauth/kakao/start?mode=login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 18px",
                minHeight: 60,
                borderRadius: 14,
                background: "#FEE500",
                color: "#3C1E1E",
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: "-0.01em",
              }}
            >
              <KakaoMark size={26} />
              <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>카카오로 로그인</span>
            </a>
          ) : null}
          {naverEnabled ? (
            <a
              href="/api/auth/oauth/naver/start?mode=login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 18px",
                minHeight: 60,
                borderRadius: 14,
                background: "#03C75A",
                color: "#fff",
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: "-0.01em",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#03C75A",
                  fontWeight: 900,
                  fontSize: 15,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                N
              </div>
              <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>네이버로 로그인</span>
            </a>
          ) : null}
          {googleEnabled ? (
            <a
              href="/api/auth/oauth/google/start?mode=login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 18px",
                minHeight: 60,
                borderRadius: 14,
                background: "#fff",
                color: "#1F1A14",
                border: "2px solid #E8DCC7",
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: "-0.01em",
              }}
            >
              <GoogleMark size={26} />
              <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>구글로 로그인</span>
            </a>
          ) : null}
        </div>
      ) : null}

      {/* 구분선 */}
      {hasSocial ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: "#E8DCC7" }} />
          <span style={{ fontSize: 12, color: "#9C907F", fontWeight: 700 }}>또는 이메일로 로그인</span>
          <div style={{ flex: 1, height: 1, background: "#E8DCC7" }} />
        </div>
      ) : null}

      {/* 이메일 폼 */}
      <form method="post" action="/api/auth/login/request">
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
          이메일 주소
        </label>
        <input
          required
          type="text"
          inputMode="email"
          name="email"
          autoComplete="email"
          placeholder="morning@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            marginBottom: 16,
          }}
        />

        <label
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 800,
            color: "#1F1A14",
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}
        >
          비밀번호
        </label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              minHeight: 60,
              padding: "0 52px 0 18px",
              background: "#fff",
              border: "2px solid #E8DCC7",
              borderRadius: 14,
              fontSize: 17,
              fontWeight: 600,
              color: "#1F1A14",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#7A6F62",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            {showPassword ? "숨김" : "보기"}
          </button>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 14,
            fontSize: 14,
            fontWeight: 700,
            color: "#4A4037",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            name="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: "#E57C23" }}
          />
          자동로그인
        </label>

        <button
          type="submit"
          style={{
            width: "100%",
            minHeight: 60,
            marginTop: 22,
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
          {buttonLabel}
        </button>
      </form>
    </div>
  );
}
