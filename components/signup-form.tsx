"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, DollarSign, Eye, EyeOff, Heart, House, Mail, Newspaper, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Field, FieldHint, FieldLabel, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SectionEyebrow } from "@/components/ui/panel";
import { Toast } from "@/components/ui/toast";
import { MAIN_INTERESTS, SUB_INTERESTS, type MainInterest } from "@/lib/content/sub-interests";
import { encodeShareState } from "@/lib/share";
import { cn } from "@/lib/utils";

const INTEREST_ICON_COMPONENTS = {
  건강: Heart,
  돈: DollarSign,
  실생활: House,
  뉴스: Newspaper,
  관계: Users
} as const;

type Step = "interests" | "auth-method" | "email-form";

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
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(defaultEmail ? "email-form" : "interests");

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function isValidEmailClient(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

  function handleNextToAuth() {
    if (selectedInterests.length !== 3) {
      setToast("관심사 3가지를 모두 선택해 주세요.");
      return;
    }
    setStep("auth-method");
  }

  function buildOauthHref(provider: "google" | "kakao" | "naver") {
    const interestParam = encodeURIComponent(selectedInterests.join(","));
    const subParam = encodeURIComponent(JSON.stringify(subInterests));
    return `/api/auth/oauth/${provider}/start?mode=signup&interests=${interestParam}&sub=${subParam}`;
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
          deliveryTime: "08:00",
          passwordEnabled: true,
          password,
          agreeToTerms: true,
          agreeToPrivacy: true,
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
    <div>
      {/* Step 1: 관심사 선택 */}
      {step === "interests" ? (
        <div className="space-y-8 md:space-y-12">
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <SectionEyebrow>관심사 선택</SectionEyebrow>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-gray-900 md:text-[40px]">딱 3가지를 골라주세요.</h2>
              </div>
              <p className="rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-semibold text-gray-600">선택 수 {selectedInterests.length}/3</p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 md:gap-4">
              {mainInterests.map((interest) => {
                const active = selectedInterests.includes(interest);
                const Icon = INTEREST_ICON_COMPONENTS[interest as MainInterest] ?? Newspaper;

                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "w-full cursor-pointer rounded-2xl border px-4 py-3 text-left transition duration-150 md:px-5 md:py-4",
                      active
                        ? "border-orange-500 bg-orange-50/50 text-gray-900"
                        : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-12 md:w-12",
                        active ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                      )}>
                        <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.2} aria-hidden="true" />
                      </span>
                      <span className="block min-w-[3em] text-xl font-extrabold tracking-[-0.04em] md:text-2xl">{interestLabels[interest]}</span>

                      <div className="ml-auto w-[120px] shrink-0 md:w-[140px]">
                        {active ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <CustomSelect
                              value={subInterests[interest] ?? ""}
                              onChange={(val) =>
                                setSubInterests((prev) => ({
                                  ...prev,
                                  [interest]: val
                                }))
                              }
                              placeholder="세부 선택"
                              options={(subInterestOptions[interest] ?? []).map((option) => ({
                                value: option,
                                label: option
                              }))}
                            />
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <ChevronDown className="h-5 w-5 text-gray-300" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <Button
            type="button"
            size="lg"
            fullWidth
            className="text-xl tracking-[-0.02em]"
            disabled={selectedInterests.length !== 3}
            onClick={handleNextToAuth}
          >
            무료 소식 받기
          </Button>
        </div>
      ) : null}

      {/* Step 2: 가입 방법 선택 */}
      {step === "auth-method" ? (
        <div className="space-y-6">
          <div className="text-center">
            <SectionEyebrow>가입 방법 선택</SectionEyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-gray-900 md:text-[34px]">어떻게 시작할까요?</h2>
            <p className="mt-3 text-base leading-7 text-gray-600">소셜 계정으로 간편하게 시작하거나, 이메일로 가입할 수 있어요.</p>
          </div>

          <div className="flex flex-col gap-3">
            {googleEnabled ? (
              <a
                href={buildOauthHref("google")}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-6 text-lg font-bold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
              >
                구글로 시작하기
              </a>
            ) : null}
            {kakaoEnabled ? (
              <a
                href={buildOauthHref("kakao")}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#FEE500] px-6 text-lg font-bold text-[#191600] transition hover:brightness-[0.96]"
              >
                카카오로 시작하기
              </a>
            ) : null}
            {naverEnabled ? (
              <a
                href={buildOauthHref("naver")}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#03C75A] px-6 text-lg font-bold text-white transition hover:brightness-[0.96]"
              >
                네이버로 시작하기
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setStep("email-form")}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-6 text-lg font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
              이메일로 시작하기
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep("interests")}
            className="mx-auto block text-sm font-semibold text-gray-500 underline underline-offset-4 hover:text-gray-700"
          >
            관심사 다시 선택하기
          </button>
        </div>
      ) : null}

      {/* Step 3: 이메일 입력 폼 */}
      {step === "email-form" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div className="text-center">
            <SectionEyebrow>이메일 가입</SectionEyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-gray-900 md:text-[34px]">이메일을 입력해주세요.</h2>
            <p className="mt-3 text-base leading-7 text-gray-600">매일 아침 세 줄 브리핑을 받으실 이메일을 알려주세요.</p>
          </div>

          <Field>
            <FieldLabel>이메일 주소</FieldLabel>
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
          </Field>

          <Field>
            <FieldLabel>비밀번호</FieldLabel>
            <FieldHint>8자 이상</FieldHint>
            <div className="relative mt-2">
              <TextInput
                required
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="비밀번호 입력"
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </Field>

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

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-700 cursor-pointer hover:bg-gray-50 transition">
            <input
              type="checkbox"
              required
              className="mt-0.5 h-5 w-5 shrink-0 accent-orange-500"
            />
            <span>
              <a href="/terms" target="_blank" className="font-semibold text-orange-500 underline underline-offset-4">이용약관</a> 및{" "}
              <a href="/terms" target="_blank" className="font-semibold text-orange-500 underline underline-offset-4">개인정보처리방침</a>에 동의합니다.
            </span>
          </label>

          {error ? <Notice tone="error">{error}</Notice> : null}

          <Button
            disabled={submitting}
            type="submit"
            size="lg"
            fullWidth
            className="text-xl tracking-[-0.02em]"
          >
            {submitting ? "저장 중입니다..." : "가입 완료하기"}
          </Button>

          <button
            type="button"
            onClick={() => setStep("auth-method")}
            className="mx-auto block text-sm font-semibold text-gray-500 underline underline-offset-4 hover:text-gray-700"
          >
            다른 방법으로 가입하기
          </button>
        </form>
      ) : null}

      {toast ? <Toast message={toast} tone="error" /> : null}
    </div>
  );
}
