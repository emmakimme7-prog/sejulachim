import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Panel, PanelBody, SectionEyebrow } from "@/components/ui/panel";
import { ResetPasswordRequestForm } from "@/components/reset-password-request-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ token?: string; sent?: string; error?: string; email?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token, sent, error, email } = await searchParams;

  return (
    <div className="app-shell max-w-3xl section-block">
      <Panel>
        <PanelBody>
        <SectionEyebrow>RESET PASSWORD</SectionEyebrow>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.3] text-gray-900">비밀번호 재설정</h1>

        {sent ? (
          <Notice tone="success" className="mt-6">입력하신 이메일로 안내를 보냈습니다</Notice>
        ) : null}
        {error === "not-found" ? (
          <Notice tone="error" className="mt-6">아직 가입되지 않은 이메일입니다. 먼저 무료 소식 받기에서 신청해주세요.</Notice>
        ) : null}
        {error === "no-password" ? (
          <Notice tone="error" className="mt-6">이 계정은 비밀번호가 아직 없습니다. 이메일 로그인 링크로 먼저 로그인해주세요.</Notice>
        ) : null}
        {error === "invalid-email" ? (
          <Notice tone="error" className="mt-6">유효한 이메일 주소를 입력해주세요.</Notice>
        ) : null}
        {error ? (
          error !== "not-found" && error !== "no-password" && error !== "invalid-email" ? <Notice tone="error" className="mt-6">링크가 만료되었거나 사용할 수 없습니다.</Notice> : null
        ) : null}

        {token ? (
          <form method="post" action="/api/auth/password/reset/verify" className="mt-8 grid gap-4">
            <input type="hidden" name="token" value={token} />
            <Field>
              <FieldLabel>새 비밀번호를 입력해주세요</FieldLabel>
              <TextInput
                type="password"
                name="password"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" size="lg" fullWidth>비밀번호 재설정</Button>
          </form>
        ) : (
          <ResetPasswordRequestForm defaultEmail={email ?? ""} />
        )}
        </PanelBody>
      </Panel>
    </div>
  );
}
