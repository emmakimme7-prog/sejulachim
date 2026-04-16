"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, DollarSign, Heart, House, Newspaper, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint, FieldLabel, SelectInput, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SectionEyebrow } from "@/components/ui/panel";
import { Toast } from "@/components/ui/toast";
import { MAIN_INTERESTS, SUB_INTERESTS, type MainInterest } from "@/lib/content/sub-interests";
import { encodeShareState } from "@/lib/share";
import { cn } from "@/lib/utils";

const deliveryTimes = ["07:00", "08:00", "09:00"] as const;
const INTEREST_ICON_COMPONENTS = {
  건강: Heart,
  돈: DollarSign,
  실생활: House,
  뉴스: Newspaper,
  관계: Users
} as const;

const TERMS_BODY = [
  "세줄아침은 사용자가 고른 관심사에 맞춰 매일 아침 세 줄 요약을 이메일로 보내드리는 서비스입니다.",
  "서비스 가입 시 이메일 주소, 수신 시간, 관심 주제를 저장하며, 사용자는 언제든지 설정 변경이나 수신 해지를 요청할 수 있습니다.",
  "서비스 운영상 필요한 경우 발송 시간과 제공 방식은 예고 후 조정될 수 있습니다."
] as const;

const PRIVACY_BODY = [
  "세줄아침은 이메일 발송과 계정 식별을 위해 이메일 주소, 수신 시간, 관심 주제, 선택한 프로필 정보를 수집할 수 있습니다.",
  "수집된 정보는 브리핑 발송, 로그인 인증, 사용자 설정 저장, 수신 해지 처리 목적에만 사용합니다.",
  "이용자는 언제든지 수신 해지와 설정 변경을 요청할 수 있습니다."
] as const;

export function SignupForm({
  initialInterests = [],
  initialSubInterests = {},
  defaultEmail = "",
  kakaoEnabled = false,
  googleEnabled = false,
  naverEnabled = false,
  mainInterests = [...MAIN_INTERESTS],
  subInterestOptions = SUB_INTERESTS,
  interestLabels = Object.fromEntries(MAIN_INTERESTS.map((interest) => [interest, interest])) as Record<string, string>
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
  const [deliveryTime, setDeliveryTime] = useState<(typeof deliveryTimes)[number]>("08:00");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState<"terms" | "privacy" | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const passwordChecks = [
    { label: "8자 이상", valid: password.trim().length >= 8 },
    { label: "숫자 1자 이상", valid: /\d/.test(password) }
  ];

  function isValidEmailClient(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function isStrongEnoughPasswordClient(value: string, emailValue: string) {
    const normalized = value.trim().toLowerCase();
    if (normalized.length < 8) {
      return false;
    }

    if (/^(.)\1+$/.test(normalized)) {
      return false;
    }

    if (!/\d/.test(normalized)) {
      return false;
    }

    return true;
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
      if (current.length >= 3) {
        return current;
      }
      return [...current, interest];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    if (passwordEnabled && !password.trim()) {
      setToast("비밀번호를 입력해 주세요.");
      setSubmitting(false);
      return;
    }

    if (passwordEnabled && !isStrongEnoughPasswordClient(password, email)) {
      setToast("비밀번호 규칙을 확인해 주세요.");
      setSubmitting(false);
      return;
    }

    if (!agreeToTerms || !agreeToPrivacy) {
      setToast("필수 약관에 동의해 주세요.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          interests: selectedInterests,
          subInterests,
          email,
          deliveryTime,
          passwordEnabled,
          password,
          agreeToTerms,
          agreeToPrivacy,
          honeypot
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "신청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const shareQuery = encodeShareState({
        interests: selectedInterests,
        subInterests
      });
      router.push(shareQuery ? `/complete?${shareQuery}` : "/complete");
    } catch {
      setError("네트워크 문제로 신청을 완료하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-8 md:space-y-12">
          {googleEnabled || kakaoEnabled || naverEnabled ? (
            <div className="rounded-[28px] border border-navy-100 bg-navy-50/70 p-5 text-center md:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-navy-500">SOCIAL</p>
              <p className="mt-3 text-base leading-7 text-navy-800">소셜 계정의 이메일을 불러와 더 빠르게 시작할 수 있어요.</p>
              <div className="mt-4 flex flex-col gap-3">
                {googleEnabled ? (
                  <a
                    href="/api/auth/oauth/google/start?mode=signup"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-navy-200 bg-white px-6 text-base font-bold text-navy-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:border-navy-300 hover:bg-navy-50"
                  >
                    구글로 이메일 불러오기
                  </a>
                ) : null}
                {kakaoEnabled ? (
                  <a
                    href="/api/auth/oauth/kakao/start?mode=signup"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FEE500] px-6 text-base font-bold text-[#191600] shadow-[0_10px_30px_rgba(254,229,0,0.28)] transition hover:brightness-[0.98]"
                  >
                    카카오로 이메일 불러오기
                  </a>
                ) : null}
                {naverEnabled ? (
                  <a
                    href="/api/auth/oauth/naver/start?mode=signup"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#03C75A] px-6 text-base font-bold text-white shadow-[0_10px_30px_rgba(3,199,90,0.28)] transition hover:brightness-[0.95]"
                  >
                    네이버로 이메일 불러오기
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <SectionEyebrow>1. 관심사 선택</SectionEyebrow>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-navy-900 md:text-[42px]">딱 3가지를 골라주세요.</h2>
              </div>
              <p className="rounded-full bg-navy-50 px-4 py-2 text-sm font-semibold text-navy-500">선택 수 {selectedInterests.length}/3</p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 md:gap-5">
              {mainInterests.map((interest) => {
                const active = selectedInterests.includes(interest);
          const Icon = INTEREST_ICON_COMPONENTS[interest as MainInterest] ?? Newspaper;

                return (
                  <div
                    key={interest}
                    className={cn(
                      "w-full rounded-[20px] border px-4 py-4 text-left transition duration-150 md:rounded-[28px] md:px-6 md:py-6",
                      active
                        ? "border-orange-500 bg-orange-50/60 text-navy-900 shadow-[inset_0_0_0_1px_rgba(229,124,35,0.08)]"
                        : "border-navy-100 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="flex w-full items-center justify-between gap-4 text-left focus:outline-none"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-orange-500 shadow-sm md:h-14 md:w-14">
                          <Icon className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.2} aria-hidden="true" />
                        </span>
                        <span className="block text-[26px] font-extrabold tracking-[-0.04em] md:text-[34px]">{interestLabels[interest]}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-6 w-6 shrink-0 text-orange-500 transition-transform",
                          active ? "rotate-180" : "rotate-0"
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {active ? (
                      <div className="mt-4 border-t border-orange-100 pt-4 md:mt-5 md:pt-5">
                        <span className="mb-3 block text-sm font-semibold text-navy-700">{interestLabels[interest]} 세부 관심</span>
                        <div className="relative">
                          <SelectInput
                            value={subInterests[interest] ?? ""}
                            onChange={(event) =>
                              setSubInterests((prev) => ({
                                ...prev,
                                [interest]: event.target.value
                              }))
                            }
                            className="min-h-12 rounded-2xl bg-white pr-14 appearance-none"
                          >
                            <option value="">선택 안 함</option>
                            {(subInterestOptions[interest] ?? []).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </SelectInput>
                          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-500" aria-hidden="true" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid w-full gap-5">
            <Field>
              <FieldLabel>2. 소식 받아보실 시간</FieldLabel>
              <div className="grid w-full gap-3 sm:grid-cols-3">
                {deliveryTimes.map((time) => {
                  const active = deliveryTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setDeliveryTime(time)}
                      className={cn(
                        "min-h-14 rounded-3xl border px-5 py-4 text-left text-lg font-bold transition",
                        active
                          ? "border-orange-500 bg-orange-50 text-navy-900 shadow-[inset_0_0_0_1px_rgba(229,124,35,0.08)]"
                          : "border-navy-100 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50"
                      )}
                    >
                      오전 {time}
                    </button>
                  );
                })}
              </div>
              <FieldHint>
                신청한 오늘은 신청 시점에 메일이 바로 발송됩니다. 선택하신 시간은 다음 날부터 적용됩니다.
              </FieldHint>
            </Field>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <FieldLabel>3. 소식 받으실 곳</FieldLabel>
              </div>
              <TextInput
                required
                type="text"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="morning@example.com"
                className="mt-2 w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-navy-700">비밀번호 설정</span>
              <button
                type="button"
                role="switch"
                aria-label="비밀번호 설정하기"
                aria-checked={passwordEnabled}
                onClick={() => setPasswordEnabled((current) => !current)}
                className={cn(
                  "relative inline-flex h-8 w-14 shrink-0 rounded-full transition",
                  passwordEnabled ? "bg-orange-500" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition",
                    passwordEnabled ? "left-7" : "left-1"
                  )}
                />
              </button>
            </div>

            {passwordEnabled ? (
              <div className="rounded-2xl border border-navy-100 bg-navy-50 p-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <FieldLabel>비밀번호(선택)</FieldLabel>
                  <p className="text-sm leading-7 text-navy-400">비밀번호를 설정하면 다음부터 더 빠르게 로그인할 수 있어요.</p>
                </div>
                <TextInput
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="비밀번호를 설정하셨다면 입력해주세요"
                  className="mt-2 w-full"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {passwordChecks.map((rule) => (
                    <span
                      key={rule.label}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        rule.valid
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-navy-100 bg-white text-navy-500"
                      )}
                    >
                      {rule.valid ? "완료" : "미충족"} · {rule.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <label className="hidden">
            회사명
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
              name="company"
            />
          </label>

          {error ? <Notice tone="error">{error}</Notice> : null}

          <div className="space-y-3 rounded-[20px] border border-navy-100 bg-navy-50/60 p-4 md:rounded-[24px] md:p-5">
            <label className="flex items-start gap-3 border-b border-navy-100 pb-3">
              <input
                type="checkbox"
                checked={agreeToTerms && agreeToPrivacy}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setAgreeToTerms(checked);
                  setAgreeToPrivacy(checked);
                }}
                className="mt-1 h-5 w-5 rounded border-navy-200 text-orange-500 focus:ring-orange-200"
              />
              <span className="text-sm font-semibold leading-7 text-navy-900">전체 동의합니다.</span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(event) => setAgreeToTerms(event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-navy-200 text-orange-500 focus:ring-orange-200"
              />
              <span className="text-sm leading-7 text-navy-700">
                <button
                  type="button"
                  onClick={() => setShowAgreementModal("terms")}
                  className="font-semibold text-navy-900 underline underline-offset-4"
                >
                  이용약관
                </button>
                에 동의합니다.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreeToPrivacy}
                onChange={(event) => setAgreeToPrivacy(event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-navy-200 text-orange-500 focus:ring-orange-200"
              />
              <span className="text-sm leading-7 text-navy-700">
                <button
                  type="button"
                  onClick={() => setShowAgreementModal("privacy")}
                  className="font-semibold text-navy-900 underline underline-offset-4"
                >
                  개인정보처리방침
                </button>
                에 동의합니다.
              </span>
            </label>
          </div>

          <Button
            disabled={submitting}
            type="submit"
            size="lg"
            fullWidth
            className="text-xl tracking-[-0.02em]"
          >
            {submitting ? "저장 중입니다..." : "무료 소식 받기"}
          </Button>
      </div>

      {showAgreementModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/45 px-5 py-8"
          onClick={() => setShowAgreementModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-navy-100 md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">약관 안내</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-navy-900">
                  {showAgreementModal === "terms" ? "이용약관" : "개인정보처리방침"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementModal(null)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-navy-200 bg-white text-navy-900"
                aria-label="모달 닫기"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 max-h-[420px] space-y-3 overflow-y-auto rounded-[24px] border border-navy-100 bg-navy-50/60 p-5">
              {(showAgreementModal === "terms" ? TERMS_BODY : PRIVACY_BODY).map((paragraph) => (
                <p key={paragraph} className="text-base leading-8 text-navy-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {toast ? <Toast message={toast} tone="error" /> : null}
    </form>
  );
}
