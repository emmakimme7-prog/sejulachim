"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint, FieldLabel, TextInput } from "@/components/ui/field";
import { cn } from "@/lib/utils";

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
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(defaultRememberMe);

  const buttonLabel = useMemo(
    () => (password.trim().length > 0 ? "로그인" : "이메일로 로그인 링크 보내기"),
    [password]
  );

  return (
    <div className="mt-8 grid gap-5">
      <form method="post" action="/api/auth/login/request" className="grid gap-5">
        <Field>
          <FieldLabel>이메일 입력</FieldLabel>
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
          <FieldLabel>비밀번호(선택)</FieldLabel>
          <TextInput
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="비밀번호를 설정하셨다면 입력해주세요"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <FieldHint>비밀번호를 설정하면 다음부터 더 빠르게 로그인할 수 있어요</FieldHint>

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
      </form>

      {googleEnabled ? (
        <Link
          href="/api/auth/oauth/google/start?mode=login"
          className={cn(
            "inline-flex min-h-14 w-full items-center justify-center rounded-full border border-navy-200 bg-white px-6 text-lg font-bold text-navy-900 transition",
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
            "inline-flex min-h-14 w-full items-center justify-center rounded-full px-6 text-lg font-bold transition",
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
            "inline-flex min-h-14 w-full items-center justify-center rounded-full px-6 text-lg font-bold transition",
            "bg-[#03C75A] text-white shadow-[0_10px_30px_rgba(3,199,90,0.28)] hover:brightness-[0.95]"
          )}
        >
          네이버로 로그인
        </Link>
      ) : null}
    </div>
  );
}
