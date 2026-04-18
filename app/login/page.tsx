import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: true },
};
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Panel, PanelBody, SectionEyebrow, SoftCard } from "@/components/ui/panel";
import { isGoogleOauthConfigured, isKakaoOauthConfigured, isNaverOauthConfigured } from "@/lib/auth/kakao-oauth";
import { getCurrentUserSession } from "@/lib/auth/user-session";

type PageProps = {
  searchParams: Promise<{ sent?: string; error?: string; reset?: string; verified?: string; email?: string }>;
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
    <div className="app-shell max-w-xl py-10 md:py-16">
      <Panel className="rounded-none border-0 bg-transparent md:rounded-2xl md:border md:border-gray-200 md:bg-white">
        <PanelBody className="px-0 py-4 md:p-10">
        <SectionEyebrow>LOGIN</SectionEyebrow>
        <h1 className="mt-3 text-3xl font-extrabold leading-[1.25] tracking-[-0.03em] text-gray-900 md:text-[40px]">로그인</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">
          이메일만 입력하면 로그인 링크를 보내드립니다. 비밀번호를 설정해두셨다면 이메일과 비밀번호로 바로 로그인하실 수 있습니다.
        </p>

        {sent ? (
          <Notice tone="success" className="mt-6">입력하신 이메일로 안내를 보냈습니다</Notice>
        ) : null}
        {reset ? (
          <Notice tone="success" className="mt-6">비밀번호가 바뀌었습니다. 새 비밀번호로 로그인해보세요.</Notice>
        ) : null}
        {error === "password" ? (
          <Notice tone="error" className="mt-6">비밀번호가 일치하지 않거나 비밀번호 로그인이 필요한 계정입니다.</Notice>
        ) : null}
        {error === "not-found" ? (
          <Notice tone="error" className="mt-6">아직 가입되지 않은 이메일입니다. 먼저 무료 소식 받기에서 신청해주세요.</Notice>
        ) : null}
        {error === "invalid-email" ? (
          <Notice tone="error" className="mt-6">유효한 이메일 주소를 입력해주세요.</Notice>
        ) : null}
        {error === "expired" ? (
          <Notice tone="error" className="mt-6">로그인 링크가 만료되었거나 이미 사용되었습니다.</Notice>
        ) : null}
        {error === "kakao-consent" ? (
          <Notice tone="error" className="mt-6">카카오 로그인 시 이메일 제공 동의가 필요합니다.</Notice>
        ) : null}
        {error === "kakao" ? (
          <Notice tone="error" className="mt-6">카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.</Notice>
        ) : null}
        {error === "google" ? (
          <Notice tone="error" className="mt-6">구글 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.</Notice>
        ) : null}
        {error === "naver" ? (
          <Notice tone="error" className="mt-6">네이버 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.</Notice>
        ) : null}
        {error === "already-registered" ? (
          <Notice tone="info" className="mt-6">이미 가입된 계정입니다. 아래에서 로그인해주세요.</Notice>
        ) : null}
        {verified && session && !session.hasPassword ? (
          <SoftCard className="mt-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">이메일 확인이 완료되었습니다.</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">다음부터 이메일 확인 없이 로그인하시겠어요?</p>
            </div>
            <form method="post" action="/api/auth/password/set" className="grid gap-4">
              <Field>
                <FieldLabel>새 비밀번호를 입력해주세요</FieldLabel>
                <TextInput type="password" name="password" minLength={8} autoComplete="new-password" required />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" size="lg">비밀번호 설정하기</Button>
                <Link
                  href="/"
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-gray-200 bg-white px-6 text-base font-bold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  다음에 설정하기
                </Link>
              </div>
            </form>
          </SoftCard>
        ) : null}

        <LoginForm
          defaultEmail={email ?? ""}
          defaultRememberMe={false}
          kakaoEnabled={kakaoEnabled}
          googleEnabled={googleEnabled}
          naverEnabled={naverEnabled}
        />

        <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-gray-600">
          <Link href="/reset-password" className="underline underline-offset-4 hover:text-gray-900">
            비밀번호 재설정
          </Link>
          <Link href="/signup" className="underline underline-offset-4 hover:text-gray-900">
            아직 가입하지 않으셨나요?
          </Link>
        </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
