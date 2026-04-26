"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CustomSelect } from "@/components/ui/custom-select";
import { Notice } from "@/components/ui/notice";
import { Toast } from "@/components/ui/toast";
import { MAIN_INTERESTS, SUB_INTERESTS, type MainInterest } from "@/lib/content/sub-interests";
import { encodeShareState } from "@/lib/share";
import { normalizeEmail } from "@/lib/utils";

type Step = "interests" | "delivery" | "auth";
const STEP_ORDER: Step[] = ["interests", "delivery", "auth"];
const TOTAL_STEPS = STEP_ORDER.length;

const INTEREST_META: Record<string, { emoji: string; color: string; bg: string; desc: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC", desc: "혈압, 당뇨, 건강검진 등" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0", desc: "연금, 보험, 세금 정보" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD", desc: "집, 가전, 계절 팁" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF", desc: "꼭 알아야 할 소식" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF", desc: "가족, 친구, 마음 건강" },
};

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

export function SignupForm({
  initialInterests = [],
  initialSubInterests = {},
  defaultEmail = "",
  kakaoEnabled = false,
  googleEnabled = false,
  naverEnabled = false,
  mainInterests = [...MAIN_INTERESTS],
  subInterestOptions = SUB_INTERESTS,
  interestLabels = Object.fromEntries(MAIN_INTERESTS.map((interest) => [interest, interest])) as Record<string, string>,
}: {
  initialInterests?: string[];
  initialSubInterests?: Record<string, string>;
  defaultEmail?: string;
  kakaoEnabled?: boolean;
  googleEnabled?: boolean;
  naverEnabled?: boolean;
  mainInterests?: string[];
  subInterestOptions?: Record<string, string[]>;
  interestLabels?: Record<string, string>;
}) {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [subInterests, setSubInterests] = useState<Record<string, string>>(initialSubInterests);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const allAgreed = agreedTerms && agreedPrivacy;
  const setAllAgreed = (v: boolean) => {
    setAgreedTerms(v);
    setAgreedPrivacy(v);
  };

  const [channel, setChannel] = useState<"email" | "none">(defaultEmail ? "email" : "email");
  const emailChannel = channel === "email";
  const noneChannel = channel === "none";
  const [agreedEmailConsent, setAgreedEmailConsent] = useState(false);
  const [emailFormExpanded, setEmailFormExpanded] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  const [step, setStep] = useState<Step>(defaultEmail ? "auth" : "interests");

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function resetAuthFields(options?: { keepEmailFormExpanded?: boolean }) {
    setPassword("");
    setShowPassword(false);
    setHoneypot("");
    setSubmitting(false);
    setError("");
    setAgreedTerms(false);
    setAgreedPrivacy(false);
    setVerificationSent(false);
    setVerificationCode("");
    setSendingCode(false);
    setEmailFormExpanded(options?.keepEmailFormExpanded ?? false);
  }

  function resetVerificationState() {
    setVerificationSent(false);
    setVerificationCode("");
    setSendingCode(false);
    setError("");
  }

  function isValidEmailClient(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
  }

  function toggleInterest(interest: string) {
    setError("");
    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        setSubInterests((prev) => {
          const next = { ...prev };
          delete next[interest];
          return next;
        });
        return current.filter((item) => item !== interest);
      }
      if (current.length >= 3) return current;
      return [...current, interest];
    });
  }

  function handleNextToDelivery() {
    if (selectedInterests.length !== 3) {
      setToast("관심사 3가지를 모두 선택해 주세요.");
      return;
    }
    setStep("delivery");
  }

  function handleNextToAuth() {
    if (emailChannel && !isValidEmailClient(email)) {
      setToast("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (emailChannel && !agreedEmailConsent) {
      setToast("매일 아침 이메일 받기 수신 동의에 체크해 주세요.");
      return;
    }
    setStep("auth");
  }

  async function requestVerificationCode() {
    if (!isValidEmailClient(email)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (!agreedTerms || !agreedPrivacy) {
      setError("이용약관과 개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    setSendingCode(true);
    setError("");
    try {
      const res = await fetch("/api/signup/email-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        setError(payload.error ?? "인증번호 발송에 실패했습니다.");
        return;
      }
      setVerificationSent(true);
      setVerificationCode("");
    } catch {
      setError("네트워크 문제로 인증번호를 보내지 못했습니다.");
    } finally {
      setSendingCode(false);
    }
  }

  async function resendVerificationCode() {
    if (!isValidEmailClient(email)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    setSendingCode(true);
    setError("");
    setVerificationCode("");
    try {
      const res = await fetch("/api/signup/email-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        setError(payload.error ?? "인증번호 재발송에 실패했습니다.");
        return;
      }
    } catch {
      setError("네트워크 문제로 인증번호를 다시 보내지 못했습니다.");
    } finally {
      setSendingCode(false);
    }
  }

  function buildOauthHref(provider: "google" | "kakao" | "naver") {
    const interestParam = encodeURIComponent(selectedInterests.join(","));
    const subParam = encodeURIComponent(JSON.stringify(subInterests));
    const marketingParam = emailChannel ? "1" : "0";
    const channelParam = emailChannel ? "email" : "none";
    return `/api/auth/oauth/${provider}/start?mode=signup&interests=${interestParam}&sub=${subParam}&m=${marketingParam}&ch=${channelParam}`;
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (selectedInterests.length !== 3) {
      setToast("관심사 3가지를 모두 선택해 주세요.");
      setSubmitting(false);
      return;
    }
    if (!isValidEmailClient(email)) {
      setToast("유효한 이메일 주소를 입력해주세요.");
      setSubmitting(false);
      return;
    }
    if (password.length < 8) {
      setToast("비밀번호는 8자 이상이어야 합니다.");
      setSubmitting(false);
      return;
    }
    if (!agreedTerms || !agreedPrivacy) {
      setToast("이용약관과 개인정보 수집·이용에 동의해 주세요.");
      setSubmitting(false);
      return;
    }
    // 광고성 수신 동의는 선택. 체크 안 하면 가입은 되지만 매일 소식 발송 대상에서 제외.

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: selectedInterests,
          subInterests,
          email,
          deliveryTime: "07:00",
          passwordEnabled: true,
          password,
          agreeToTerms: agreedTerms,
          agreeToPrivacy: agreedPrivacy,
          agreeToMarketing: emailChannel,
          verificationCode: verificationCode.trim() || undefined,
          honeypot,
          phone: null,
          deliveryChannels: {
            email: emailChannel,
          },
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "신청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const shareQuery = encodeShareState({
        interests: selectedInterests,
        subInterests,
      });
      router.push(shareQuery ? `/complete?${shareQuery}` : "/complete");
    } catch {
      setError("네트워크 문제로 신청을 완료하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepNumber = STEP_ORDER.indexOf(step) + 1;

  return (
    <div style={{ background: "#FFFBF5", borderRadius: 24, padding: "28px 22px 40px", border: "1.5px solid #F2E6D7", maxWidth: 560, margin: "0 auto" }}>
      {/* 진행 표시 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 999,
              background: n <= stepNumber ? "#E57C23" : "#F2E6D7",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 13, color: "#7A6F62", fontWeight: 700, marginBottom: 8 }}>
        {stepNumber}/{TOTAL_STEPS} 단계
      </div>

      {/* Step 1: 관심사 */}
      {step === "interests" ? (
        <div>
          <h1 style={{ margin: "6px 0 8px", fontSize: 26, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em", lineHeight: 1.3 }}>
            어떤 소식이 궁금하세요?
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 15, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
            관심 있는 분야 <b style={{ color: "#B2570F" }}>3개</b>를 골라 주세요. (선택 {selectedInterests.length}/3)
          </p>

          <div style={{ display: "grid", gap: 10 }}>
            {mainInterests.map((interest) => {
              const meta = INTEREST_META[interest] ?? INTEREST_META["뉴스"];
              const active = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 16px",
                    borderRadius: 16,
                    background: "#fff",
                    border: active ? `2.5px solid ${meta.color}` : "2px solid #E8DCC7",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: meta.bg,
                      fontSize: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {meta.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.01em" }}>
                      {interestLabels[interest] ?? interest}
                    </div>
                    <div style={{ fontSize: 13, color: "#7A6F62", fontWeight: 600, marginTop: 2 }}>
                      {meta.desc}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      background: active ? "#E57C23" : "#F5EEE2",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    {active ? "✓" : ""}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={selectedInterests.length !== 3}
            onClick={handleNextToDelivery}
            style={{
              width: "100%",
              minHeight: 60,
              marginTop: 24,
              background: selectedInterests.length === 3 ? "#E57C23" : "#E8DCC7",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              boxShadow: selectedInterests.length === 3 ? "0 6px 16px rgba(229, 124, 35, 0.35)" : "none",
              cursor: selectedInterests.length === 3 ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            다음
          </button>
        </div>
      ) : null}

      {/* Step 2: 받는 방법 (이메일 / 미수신) */}
      {step === "delivery" ? (
        <div>
          <h1 style={{ margin: "6px 0 8px", fontSize: 26, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em", lineHeight: 1.3 }}>
            어떻게 받으실래요?
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 15, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
            매일 아침 7시 30분에 보내드립니다.
          </p>

          <div
            style={{
              padding: 18,
              borderRadius: 20,
              background: "#F5EEE2",
              border: "1.5px solid #EAD9BF",
            }}
          >
            <div
              role="radiogroup"
              aria-label="받는 방법"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
                padding: 4,
                borderRadius: 14,
                background: "#fff",
                border: "1.5px solid #E8DCC7",
                marginBottom: 14,
              }}
            >
              <button
                type="button"
                role="radio"
                aria-checked={emailChannel}
                onClick={() => { setChannel("email"); setError(""); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  minHeight: 48,
                  padding: "0 8px",
                  borderRadius: 10,
                  background: emailChannel ? "#FFF2E3" : "transparent",
                  color: "#1F1A14",
                  border: "none",
                  fontSize: 14,
                  fontWeight: emailChannel ? 900 : 700,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s, font-weight 0.15s",
                }}
              >
                <span style={{ fontSize: 14 }} aria-hidden="true">📧</span>
                이메일
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={noneChannel}
                onClick={() => { setChannel("none"); setError(""); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  minHeight: 48,
                  padding: "0 8px",
                  borderRadius: 10,
                  background: noneChannel ? "#E8DCC7" : "transparent",
                  color: noneChannel ? "#1F1A14" : "#7A6F62",
                  border: "none",
                  fontSize: 14,
                  fontWeight: noneChannel ? 900 : 700,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s, font-weight 0.15s",
                }}
              >
                <span style={{ fontSize: 14 }} aria-hidden="true">🔕</span>
                미수신
              </button>
            </div>

            {noneChannel ? (
              <p style={{ margin: 0, fontSize: 13, color: "#7A6F62", fontWeight: 600, lineHeight: 1.6 }}>
                미수신을 선택하시면 매일 아침 소식이 <b style={{ color: "#1F1A14" }}>발송되지 않습니다</b>.
                <br />
                사이트는 이용하실 수 있지만 알림을 받지 않습니다. 언제든 설정에서 변경 가능합니다.
              </p>
            ) : (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#4A4037", marginBottom: 6, letterSpacing: "-0.01em" }}>
                  이메일
                </label>
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    resetVerificationState();
                  }}
                  placeholder="example@email.com"
                  style={{
                    width: "100%",
                    minHeight: 52,
                    padding: "0 16px",
                    background: "#fff",
                    border: "2px solid #E8DCC7",
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#1F1A14",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
          </div>

          {/* 이메일 채널 동의 체크박스 */}
          {emailChannel ? (
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginTop: 16,
                padding: "14px 14px",
                borderRadius: 12,
                background: "#fff",
                border: "1.5px solid #E8DCC7",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1.6,
                color: "#4A4037",
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={agreedEmailConsent}
                onChange={(e) => setAgreedEmailConsent(e.target.checked)}
                style={{ marginTop: 3, width: 20, height: 20, accentColor: "#E57C23", flexShrink: 0 }}
              />
              <span>
                <span style={{ color: "#B2570F", fontWeight: 700, marginRight: 4 }}>[필수]</span>
                매일 아침 <b style={{ color: "#1F1A14" }}>이메일</b>로 소식 받기에 동의합니다.
                <span style={{ display: "block", fontSize: 12, color: "#7A6F62", fontWeight: 500, marginTop: 4, lineHeight: 1.5 }}>
                  광고성 정보 수신에 동의합니다. 언제든 설정에서 철회할 수 있습니다.
                </span>
              </span>
            </label>
          ) : null}

          <button
            type="button"
            onClick={handleNextToAuth}
            style={{
              width: "100%",
              minHeight: 60,
              marginTop: 24,
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
            다음
          </button>

          <button
            type="button"
            onClick={() => {
              resetAuthFields({ keepEmailFormExpanded: false });
              setStep("interests");
            }}
            style={{
              display: "block",
              margin: "16px auto 0",
              padding: "8px 12px",
              background: "transparent",
              border: "none",
              color: "#7A6F62",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: 4,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            관심사 다시 선택하기
          </button>
        </div>
      ) : null}

      {/* Step 2: 가입 방법 (OAuth + 이메일 폼 통합) */}
      {step === "auth" ? (
        <form onSubmit={handleEmailSubmit}>
          <h1 style={{ margin: "6px 0 8px", fontSize: 26, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em", lineHeight: 1.3 }}>
            어디로 받아볼까요?
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 15, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
            매일 아침 7시에 세 줄 브리핑을 보내드립니다.
          </p>

          {/* 소셜 로그인 버튼 */}
          {(kakaoEnabled || naverEnabled || googleEnabled) ? (
            <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
              {kakaoEnabled ? (
                <a
                  href={buildOauthHref("kakao")}
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
                  <span style={{ fontSize: 20 }} aria-hidden="true">💬</span>
                  <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>카카오로 시작하기</span>
                </a>
              ) : null}
              {naverEnabled ? (
                <a
                  href={buildOauthHref("naver")}
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
                  <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>네이버로 시작하기</span>
                </a>
              ) : null}
              {googleEnabled ? (
                <a
                  href={buildOauthHref("google")}
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
                  <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>구글로 시작하기</span>
                </a>
              ) : null}
            </div>
          ) : null}

          {(kakaoEnabled || naverEnabled || googleEnabled) ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "#E8DCC7" }} />
              <span style={{ fontSize: 12, color: "#9C907F", fontWeight: 700 }}>또는 이메일로 가입</span>
              <div style={{ flex: 1, height: 1, background: "#E8DCC7" }} />
            </div>
          ) : null}

          {!emailFormExpanded ? (
            <button
              type="button"
              onClick={() => {
                if (noneChannel && !isValidEmailClient(email)) {
                  // noneChannel 사용자는 여기서 이메일 입력부터 해야 함 → expand 하되 폼 보여줌
                }
                resetVerificationState();
                setEmailFormExpanded(true);
              }}
              style={{
                width: "100%",
                minHeight: 60,
                marginTop: 0,
                background: "#E57C23",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: "-0.01em",
                boxShadow: "0 6px 16px rgba(229, 124, 35, 0.35)",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              📧 이메일로 시작하기
            </button>
          ) : null}

          {emailFormExpanded ? (
          <>
          {/* 이메일 폼 시작 */}

          {/* emailChannel 은 step 2에서 이미 이메일 받음 → 여기선 비번만 받음. noneChannel 은 여기서 이메일 입력. */}
          {noneChannel ? (
            <>
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
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  resetVerificationState();
                }}
                placeholder="예) hong@naver.com"
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
            </>
          ) : (
            <div
              style={{
                padding: "10px 14px",
                background: "#F5EEE2",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "#4A4037",
                marginBottom: 16,
              }}
            >
              📧 {email}
            </div>
          )}

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
          <div style={{ fontSize: 12, color: "#7A6F62", fontWeight: 600, marginBottom: 8 }}>8자 이상</div>
          <div style={{ position: "relative" }}>
            <input
              required
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="비밀번호 입력"
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

          {/* honeypot */}
          <label style={{ display: "none" }}>
            회사명
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              name="company"
            />
          </label>

          <div
            style={{
              marginTop: 18,
              padding: "14px 14px 10px",
              borderRadius: 12,
              background: "#fff",
              border: "1.5px solid #E8DCC7",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#4A4037",
              fontWeight: 500,
            }}
          >
            <label
              style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid #F5EEE2", cursor: "pointer", fontWeight: 700 }}
            >
              <input
                type="checkbox"
                checked={allAgreed}
                onChange={(e) => setAllAgreed(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "#E57C23", flexShrink: 0 }}
              />
              <span>모두 동의합니다 (필수)</span>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{ marginTop: 3, width: 18, height: 18, accentColor: "#E57C23", flexShrink: 0 }}
              />
              <span>
                <span style={{ color: "#B2570F", fontWeight: 700, marginRight: 4 }}>[필수]</span>
                <a href="/terms" target="_blank" style={{ color: "#E57C23", fontWeight: 800, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  이용약관
                </a>
                에 동의합니다.
              </span>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agreedPrivacy}
                onChange={(e) => setAgreedPrivacy(e.target.checked)}
                style={{ marginTop: 3, width: 18, height: 18, accentColor: "#E57C23", flexShrink: 0 }}
              />
              <span>
                <span style={{ color: "#B2570F", fontWeight: 700, marginRight: 4 }}>[필수]</span>
                <a href="/terms" target="_blank" style={{ color: "#E57C23", fontWeight: 800, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  개인정보 수집·이용
                </a>
                에 동의합니다.
              </span>
            </label>

          </div>

          {error ? <div style={{ marginTop: 16 }}><Notice tone="error">{error}</Notice></div> : null}

          {!verificationSent ? (
            <button
              type="button"
              disabled={sendingCode}
              onClick={async () => {
                await requestVerificationCode();
              }}
              style={{
                width: "100%",
                minHeight: 60,
                marginTop: 20,
                background: sendingCode ? "#E8DCC7" : "#E57C23",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: "-0.01em",
                boxShadow: sendingCode ? "none" : "0 6px 16px rgba(229, 124, 35, 0.35)",
                cursor: sendingCode ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {sendingCode ? "발송 중..." : "이메일 인증번호 받기"}
            </button>
          ) : (
            <>
              <div style={{ marginTop: 20 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 800, color: "#1F1A14", marginBottom: 4, letterSpacing: "-0.01em" }}>
                  인증번호
                </label>
                <div style={{ fontSize: 12, color: "#7A6F62", fontWeight: 600, marginBottom: 8 }}>
                  {email} 로 보낸 6자리 숫자를 입력해주세요 (10분 유효)
                </div>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  placeholder="123456"
                  style={{
                    width: "100%",
                    minHeight: 60,
                    padding: "0 18px",
                    background: "#fff",
                    border: "2px solid #E8DCC7",
                    borderRadius: 14,
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#1F1A14",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    letterSpacing: "0.4em",
                    textAlign: "center",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || verificationCode.length !== 6}
                style={{
                  width: "100%",
                  minHeight: 60,
                  marginTop: 16,
                  background: submitting || verificationCode.length !== 6 ? "#E8DCC7" : "#E57C23",
                  color: "#fff",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  boxShadow: submitting || verificationCode.length !== 6 ? "none" : "0 6px 16px rgba(229, 124, 35, 0.35)",
                  cursor: submitting || verificationCode.length !== 6 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {submitting ? "처리 중..." : "인증하고 가입 완료하기"}
              </button>
              <button
                type="button"
                disabled={sendingCode}
                onClick={async () => {
                  await resendVerificationCode();
                }}
                style={{
                  display: "block",
                  margin: "12px auto 0",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  color: "#7A6F62",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                  cursor: sendingCode ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {sendingCode ? "재발송 중..." : "인증번호 다시 받기"}
              </button>
            </>
          )}
          </>
          ) : null}

          <button
            type="button"
            onClick={() => {
              resetAuthFields({ keepEmailFormExpanded: false });
              setStep("delivery");
            }}
            style={{
              display: "block",
              margin: "16px auto 0",
              padding: "8px 12px",
              background: "transparent",
              border: "none",
              color: "#7A6F62",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: 4,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            받는 방법 다시 고르기
          </button>
        </form>
      ) : null}

      {toast ? <Toast message={toast} tone="error" /> : null}
    </div>
  );
}
