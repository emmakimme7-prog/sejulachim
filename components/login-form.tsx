"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint, FieldLabel, TextInput } from "@/components/ui/field";
import { SectionEyebrow } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

type Step = "auth-method" | "email-form";

export function LoginForm({
  defaultEmail = "",
  defaultRememberMe = false,
  kakaoEnabled = false,
  googleEnabled = false,
  naverEnabled = false
}: {
  defaultEmail?: string;
  defaultRememberMe?: boolean;
  kakaoEnabled?: boolean;
  googleEnabled?: boolean;
  naverEnabled?: boolean;
}) {
  const [step, setStep] = useState<Step>(defaultEmail ? "email-form" : "auth-method");
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(defaultRememberMe);

  const buttonLabel = useMemo(
    () => (password.trim().length > 0 ? "로그인" : "이메일로 로그인 링크 보내기"),
    [password]
  );

  return (
    <div>
      {/* Step 1: 로그인 방법 선택 */}
      {step === "auth-method" ? (
        <div className="space-y-6">
          <div className="text-center">
            <SectionEyebrow>로그인</SectionEyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-navy-900 md:text-[36px]">어떻게 로그인할까요?</h2>
            <p className="mt-3 text-base leading-7 text-navy-600">가입하신 방법으로 로그인해 주세요.</p>
          </div>

          <div className="flex flex-col gap-3">
            {googleEnabled ? (
              <Link
                href="/api/auth/oauth/google/start?mode=login"
                className={cn(
                  "inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full border border-navy-200 bg-white px-6 text-lg font-bold text-navy-900 transition",
                  "shadow-[0_10px_30px_rgba(15,23,42,0.08)] hover:border-navy-300 hover:bg-navy-50"
                )}
              >
                구글로 로그인
              </Link>
            ) : null}
            {kakaoEnabled ? (
              <Link
                href="/api/auth/oauth/kakao/start?mode=login"
                className={cn(
                  "inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-6 text-lg font-bold transition",
                  "bg-[#FEE500] text-[#191600] shadow-[0_10px_30px_rgba(254,229,0,0.28)] hover:brightness-[0.98]"
                )}
              >
                카카오로 로그인
              </Link>
            ) : null}
            {naverEnabled ? (
              <Link
                href="/api/auth/oauth/naver/start?mode=login"
                className={cn(
                  "inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-6 text-lg font-bold transition",
                  "bg-[#03C75A] text-white shadow-[0_10px_30px_rgba(3,199,90,0.28)] hover:brightness-[0.95]"
                )}
              >
                네이버로 로그인
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setStep("email-form")}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-navy-200 bg-white px-6 text-lg font-bold text-navy-700 transition hover:border-navy-300 hover:bg-navy-50"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
              이메일로 로그인
            </button>
          </div>
        </div>
      ) : null}

      {/* Step 2: 이메일 로그인 폼 */}
      {step === "email-form" ? (
        <form method="post" action="/api/auth/login/request" className="space-y-6">
          <div className="text-center">
            <SectionEyebrow>이메일 로그인</SectionEyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-navy-900 md:text-[36px]">이메일로 로그인</h2>
            <p className="mt-3 text-base leading-7 text-navy-600">가입하신 이메일과 비밀번호를 입력해 주세요.</p>
          </div>

          <Field>
            <FieldLabel>이메일 주소</FieldLabel>
            <TextInput
              required
              type="text"
              inputMode="email"
              name="email"
              autoComplete="email"
              placeholder="morning@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>비밀번호 (선택)</FieldLabel>
            <FieldHint>비밀번호를 설정하셨다면 입력해주세요</FieldHint>
            <div className="relative mt-2">
              <TextInput
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </Field>

          <label className="flex items-center gap-3 text-base font-semibold text-navy-700">
            <input
              type="checkbox"
              name="rememberMe"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-6 w-6 rounded border-navy-200 text-orange-500 focus:ring-orange-200"
            />
            자동로그인
          </label>

          <Button type="submit" size="lg" fullWidth>{buttonLabel}</Button>

          <button
            type="button"
            onClick={() => setStep("auth-method")}
            className="mx-auto block text-sm font-semibold text-navy-500 underline underline-offset-4 hover:text-navy-700"
          >
            다른 방법으로 로그인하기
          </button>
        </form>
      ) : null}
    </div>
  );
}
