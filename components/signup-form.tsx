"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CustomSelect } from "@/components/ui/custom-select";
import { Notice } from "@/components/ui/notice";
import { Toast } from "@/components/ui/toast";
import { MAIN_INTERESTS, SUB_INTERESTS, type MainInterest } from "@/lib/content/sub-interests";
import { encodeShareState } from "@/lib/share";

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
  const [agreedMarketing, setAgreedMarketing] = useState(false);
  // 필수만 충족하면 allAgreed 체크박스 상태는 3개 다 체크된 경우에만 true.
  const allAgreed = agreedTerms && agreedPrivacy && agreedMarketing;
  const setAllAgreed = (v: boolean) => {
    setAgreedTerms(v);
    setAgreedPrivacy(v);
    setAgreedMarketing(v);
  };

  // 수신 채널: 카카오톡 선택하면 step 3 에서 카카오 OAuth 강제 (알림톡 수신을 위해).
  const [channel, setChannel] = useState<"kakao" | "email">(defaultEmail ? "email" : "kakao");
  const kakaoChannel = channel === "kakao";
  const emailChannel = channel === "email";
  // 카카오 채널 선택 시 step 2에서 번호 수집 (카카오 OAuth 는 기본 scope로 번호 못 받기 때문).
  const [phone, setPhone] = useState("");
  // 카카오 채널 가입 플로우용 일괄 동의 (필수): 이용약관·개인정보·광고성 수신.
  const [agreedKakaoBundle, setAgreedKakaoBundle] = useState(false);

  const [step, setStep] = useState<Step>(defaultEmail ? "auth" : "interests");

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function isValidEmailClient(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  // 010-1234-5678 형태로 자동 포맷팅 (한국 휴대폰)
  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length < 4) return digits;
    if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  function isValidPhoneClient(value: string) {
    const digits = value.replace(/\D/g, "");
    return /^010\d{8}$/.test(digits);
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
    if (kakaoChannel && !/^010\d{8}$/.test(phone.replace(/\D/g, ""))) {
      setToast("올바른 휴대폰번호(010-XXXX-XXXX)를 입력해 주세요.");
      return;
    }
    setStep("auth");
  }

  function buildOauthHref(provider: "google" | "kakao" | "naver") {
    const interestParam = encodeURIComponent(selectedInterests.join(","));
    const subParam = encodeURIComponent(JSON.stringify(subInterests));
    // 카카오 채널 선택 시 OAuth 버튼 클릭 = 알림톡 수신 동의 간주 (UI 상 명시됨).
    const marketingParam = (kakaoChannel && provider === "kakao") || agreedMarketing ? "1" : "0";
    const channelParam = kakaoChannel ? "kakao" : "email";
    const phoneParam = kakaoChannel ? `&p=${encodeURIComponent(phone.replace(/\D/g, ""))}` : "";
    return `/api/auth/oauth/${provider}/start?mode=signup&interests=${interestParam}&sub=${subParam}&m=${marketingParam}&ch=${channelParam}${phoneParam}`;
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
          agreeToMarketing: agreedMarketing,
          honeypot,
          phone: null,
          deliveryChannels: {
            kakao: kakaoChannel,
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
                  {active ? (
                    <div onClick={(e) => e.stopPropagation()} style={{ width: 130, flexShrink: 0 }}>
                      <CustomSelect
                        value={subInterests[interest] ?? ""}
                        onChange={(val) =>
                          setSubInterests((prev) => ({ ...prev, [interest]: val }))
                        }
                        placeholder="세부 선택"
                        options={(subInterestOptions[interest as MainInterest] ?? []).map((option) => ({
                          value: option,
                          label: option,
                        }))}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        background: "#F5EEE2",
                        flexShrink: 0,
                      }}
                    />
                  )}
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

      {/* Step 2: 받는 방법 (카카오톡 / 이메일) */}
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
                aria-checked={kakaoChannel}
                onClick={() => { setChannel("kakao"); setError(""); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minHeight: 48,
                  padding: "0 14px",
                  borderRadius: 10,
                  background: kakaoChannel ? "#FEE500" : "transparent",
                  color: "#1F1A14",
                  border: "none",
                  fontSize: 15,
                  fontWeight: kakaoChannel ? 900 : 700,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s, font-weight 0.15s",
                }}
              >
                <KakaoMark size={20} />
                카카오톡
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={emailChannel}
                onClick={() => { setChannel("email"); setError(""); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minHeight: 48,
                  padding: "0 14px",
                  borderRadius: 10,
                  background: emailChannel ? "#FFF2E3" : "transparent",
                  color: "#1F1A14",
                  border: "none",
                  fontSize: 15,
                  fontWeight: emailChannel ? 900 : 700,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s, font-weight 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }} aria-hidden="true">📧</span>
                이메일
              </button>
            </div>

            {kakaoChannel ? (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#4A4037", marginBottom: 6, letterSpacing: "-0.01em" }}>
                  휴대폰번호
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => { setPhone(formatPhone(e.target.value)); setError(""); }}
                  placeholder="010-1234-5678"
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
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#7A6F62", fontWeight: 600, lineHeight: 1.5 }}>
                  이 번호로 매일 아침 알림톡이 도착합니다. 다음 단계에서 <b style={{ color: "#1F1A14" }}>카카오 계정으로 회원가입</b> 하시면 됩니다.
                </p>
              </div>
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
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#7A6F62", fontWeight: 600, lineHeight: 1.5 }}>
                  메일함으로 매일 아침 보내드립니다.
                </p>
              </div>
            )}
          </div>

          {kakaoChannel ? (
            <>
              {/* 카카오 채널 일괄 동의 체크박스 */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginTop: 18,
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
                  checked={agreedKakaoBundle}
                  onChange={(e) => setAgreedKakaoBundle(e.target.checked)}
                  style={{ marginTop: 3, width: 20, height: 20, accentColor: "#E57C23", flexShrink: 0 }}
                />
                <span>
                  <span style={{ color: "#B2570F", fontWeight: 700, marginRight: 4 }}>[필수]</span>
                  매일 아침 <b style={{ color: "#1F1A14" }}>카카오톡 알림톡</b> 받기에 동의합니다.
                  <span style={{ display: "block", fontSize: 12, color: "#7A6F62", fontWeight: 500, marginTop: 4, lineHeight: 1.5 }}>
                    <a href="/terms" target="_blank" style={{ color: "#B2570F", fontWeight: 700, textDecoration: "underline" }}>이용약관</a>
                    {" · "}
                    <a href="/terms" target="_blank" style={{ color: "#B2570F", fontWeight: 700, textDecoration: "underline" }}>개인정보 수집·이용</a>
                    {" · "}
                    광고성 정보 수신에 동의합니다. 언제든 설정에서 철회할 수 있습니다.
                  </span>
                </span>
              </label>

              <button
                type="button"
                disabled={!agreedKakaoBundle}
                onClick={() => {
                  if (!/^010\d{8}$/.test(phone.replace(/\D/g, ""))) {
                    setToast("올바른 휴대폰번호(010-XXXX-XXXX)를 입력해 주세요.");
                    return;
                  }
                  if (!agreedKakaoBundle) {
                    setToast("알림톡 수신 동의에 체크해 주세요.");
                    return;
                  }
                  window.location.href = buildOauthHref("kakao");
                }}
                style={{
                  width: "100%",
                  minHeight: 60,
                  marginTop: 16,
                  background: agreedKakaoBundle ? "#FEE500" : "#F5EEE2",
                  color: agreedKakaoBundle ? "#3C1E1E" : "#9C907F",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  boxShadow: agreedKakaoBundle ? "0 6px 16px rgba(254, 229, 0, 0.45)" : "none",
                  cursor: agreedKakaoBundle ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <KakaoMark size={24} />
                카카오톡으로 회원가입
              </button>
            </>
          ) : (
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
          )}

          <button
            type="button"
            onClick={() => setStep("interests")}
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
            {kakaoChannel ? "카카오로 회원가입" : "어디로 받아볼까요?"}
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 15, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
            {kakaoChannel
              ? "카카오톡으로 매일 아침 알림톡을 받으시려면 카카오 계정으로 가입해주세요."
              : "매일 아침 7시에 세 줄 브리핑을 보내드립니다."}
          </p>

          {/* 소셜 로그인 버튼 */}
          {(kakaoEnabled || (!kakaoChannel && (naverEnabled || googleEnabled))) ? (
            <div style={{ display: "grid", gap: 10, marginBottom: kakaoChannel ? 0 : 22 }}>
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
                  <KakaoMark size={26} />
                  <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>{kakaoChannel ? "카카오로 회원가입" : "카카오로 시작하기"}</span>
                </a>
              ) : null}
              {!kakaoChannel ? (
                <>
                  {null}
                </>
              ) : null}
              {!kakaoChannel && naverEnabled ? (
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
              {!kakaoChannel && googleEnabled ? (
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

          {/* 구분선 (카카오 채널 선택 시 이메일 폼 숨김) */}
          {!kakaoChannel && (kakaoEnabled || naverEnabled || googleEnabled) ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "#E8DCC7" }} />
              <span style={{ fontSize: 12, color: "#9C907F", fontWeight: 700 }}>또는 이메일로 가입</span>
              <div style={{ flex: 1, height: 1, background: "#E8DCC7" }} />
            </div>
          ) : null}

          {!kakaoChannel ? (
          <>
          {/* 이메일 폼 시작 */}

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

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agreedMarketing}
                onChange={(e) => setAgreedMarketing(e.target.checked)}
                style={{ marginTop: 3, width: 18, height: 18, accentColor: "#E57C23", flexShrink: 0 }}
              />
              <span>
                <span style={{ color: "#7A6F62", fontWeight: 700, marginRight: 4 }}>[선택]</span>
                <b>광고성 정보 수신</b>에 동의합니다.
                <span style={{ display: "block", fontSize: 12, color: "#7A6F62", fontWeight: 500, marginTop: 3, lineHeight: 1.5 }}>
                  매일 아침 7:30에 뉴스 요약과 제휴 상품 안내를 보내드립니다. 동의하지 않으시면 발송이 되지 않으며, 언제든 설정에서 변경할 수 있습니다.
                </span>
              </span>
            </label>
          </div>

          {error ? <div style={{ marginTop: 16 }}><Notice tone="error">{error}</Notice></div> : null}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              minHeight: 60,
              marginTop: 20,
              background: submitting ? "#E8DCC7" : "#E57C23",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              boxShadow: submitting ? "none" : "0 6px 16px rgba(229, 124, 35, 0.35)",
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {submitting ? "저장 중입니다..." : "가입 완료하기"}
          </button>
          </>
          ) : (
            /* 카카오 채널: 3-체크박스 간단 요약 (카카오 OAuth 클릭 시 동의 간주) */
            <div
              style={{
                marginTop: 16,
                padding: "14px 14px",
                borderRadius: 12,
                background: "#FFFBF5",
                border: "1.5px solid #E8DCC7",
                fontSize: 12,
                color: "#7A6F62",
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              위 <b style={{ color: "#1F1A14" }}>카카오로 회원가입</b> 버튼을 누르시면
              <a href="/terms" target="_blank" style={{ color: "#B2570F", fontWeight: 800, textDecoration: "underline", marginLeft: 4, marginRight: 2 }}>이용약관</a>과
              <a href="/terms" target="_blank" style={{ color: "#B2570F", fontWeight: 800, textDecoration: "underline", marginLeft: 4, marginRight: 2 }}>개인정보 수집·이용</a>
              에 동의하는 것으로 간주되며, 매일 아침 카카오톡 알림톡을 받으시는 것에 동의하는 것으로 처리됩니다.
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep("delivery")}
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
