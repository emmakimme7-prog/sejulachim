import type { Metadata } from "next";

import { AccountProfileForm } from "@/components/account-profile-form";
import { AccountDeleteDialog } from "@/components/account-delete-dialog";
import { AccountTabs } from "@/components/account-tabs";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

import { AccountDeliveryForm } from "@/components/account-delivery-form";
import { AccountInterestsForm } from "@/components/account-interests-form";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SoftCard } from "@/components/ui/panel";
import { type FontSizeValue } from "@/components/font-size-provider";
import { requireUserSession } from "@/lib/auth/user-session";
import { getInterestConfig } from "@/lib/content/interest-config";
import { findUserById, listUserInterestSelections } from "@/lib/mongodb/user-data";
import { getAvatarOption, isAvatarKey } from "@/lib/profile";

const TERMS_SECTIONS = [
  {
    title: "이용약관",
    body: [
      "본 약관은 세줄아침(이하 \"서비스\")이 제공하는 생활형 아침 브리핑 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 관계를 규정하는 것을 목적으로 합니다.",
      "세줄아침은 이메일로 생활형 아침 브리핑을 제공하는 서비스입니다. 가입 시 입력한 이메일과 관심 주제를 바탕으로 브리핑을 발송합니다. 신청 당일에는 신청 시점에 첫 브리핑이 발송되며, 이후에는 사용자가 선택한 시간에 맞춰 발송됩니다.",
      "본 서비스는 공개된 뉴스를 AI가 요약·재가공한 정보를 제공합니다. 정보의 정확성을 보장하지 않으며, 투자·의료·법률 판단의 근거로 사용하지 마시기 바랍니다.",
      "서비스가 제공하는 콘텐츠(AI 요약 브리핑 포함)에 대한 저작권 및 지식재산권은 서비스에 귀속됩니다.",
      "이용자는 언제든지 수신을 해지할 수 있으며, 해지 즉시 더 이상의 브리핑이 발송되지 않습니다.",
      "전체 약관은 이용약관 페이지에서 확인하실 수 있습니다."
    ]
  },
  {
    title: "개인정보처리방침",
    body: [
      "세줄아침은 개인정보보호법 제30조에 따라 이용자의 개인정보를 보호하고 관련 고충을 신속하게 처리하기 위하여 개인정보처리방침을 수립·공개합니다.",
      "수집 항목: 이메일 주소, 비밀번호(필수), 별명, 프로필 사진(선택), 수신 시간·관심 주제·이용 기록(자동 수집)",
      "수집된 정보는 브리핑 발송, 로그인 인증, 사용자 설정 저장, 수신 해지 처리 목적에만 사용합니다.",
      "수신 해지 또는 계정 삭제 요청 시 30일 이내에 파기합니다. 이메일 발송은 Resend Inc., 데이터베이스 저장은 Supabase Inc.에 위탁하고 있습니다.",
      "이용자는 언제든지 개인정보 열람·수정·삭제 및 수신 해지를 요청할 수 있으며, studiobyyou0@gmail.com으로 연락하시면 10일 이내에 처리합니다.",
      "전체 개인정보처리방침은 이용약관 페이지에서 확인하실 수 있습니다. (시행일: 2026년 4월 9일)"
    ]
  }
] as const;

type PageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

export default async function AccountPage({ searchParams }: PageProps) {
      const session = await requireUserSession();
  const user = await findUserById(session.id);
  const profileUser = user as
    | (typeof user & {
        avatar_key?: string | null;
        avatar_data_url?: string | null;
        nickname?: string | null;
        font_size_preference?: string | null;
        delivery_email?: boolean | null;
        marketing_consent_at?: string | null;
      })
    | null;
  const initialChannel: "email" | "none" = profileUser?.delivery_email ? "email" : "none";
  const hasMarketingConsent = Boolean(profileUser?.marketing_consent_at);
  const interestRows = await listUserInterestSelections(session.id);
  const interestConfig = await getInterestConfig();
  const { status, error } = await searchParams;
  const selectedInterests = interestRows
    .map((row) => row.main_interest)
    .filter((value) => interestConfig.mainInterests.includes(value));
  const subInterests = Object.fromEntries(
    interestRows.filter((row) => row.sub_interest).map((row) => [row.main_interest, row.sub_interest ?? ""])
  ) as Record<string, string>;

  const authProvider = (profileUser as { auth_provider?: string } | null)?.auth_provider ?? "email";
  const AUTH_PROVIDER_BADGE: Record<string, { label: string; bg: string; text: string }> = {
    email: { label: "이메일", bg: "bg-gray-100", text: "text-gray-700" },
    google: { label: "구글", bg: "bg-blue-100", text: "text-blue-700" },
    kakao: { label: "카카오", bg: "bg-yellow-100", text: "text-yellow-800" },
    naver: { label: "네이버", bg: "bg-green-100", text: "text-green-700" },
  };
  const providerBadge = AUTH_PROVIDER_BADGE[authProvider] ?? AUTH_PROVIDER_BADGE.email;
  const avatarKey = isAvatarKey(profileUser?.avatar_key) ? profileUser.avatar_key : "sun";
  const nickname = typeof profileUser?.nickname === "string" && profileUser.nickname.trim() ? profileUser.nickname : session.email.split("@")[0];
  const avatarDataUrl = typeof profileUser?.avatar_data_url === "string" ? profileUser.avatar_data_url : undefined;
  const fontSize = (profileUser?.font_size_preference === "small" || profileUser?.font_size_preference === "medium" || profileUser?.font_size_preference === "large"
    ? profileUser.font_size_preference
    : "medium") as FontSizeValue;
  const avatar = getAvatarOption(avatarKey);

  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "#fff",
            borderRadius: 999,
            border: "1.5px solid #F5DDC2",
            fontSize: 12,
            fontWeight: 800,
            color: "#B2570F",
            marginBottom: 12,
          }}
        >
          프로필
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          내 정보
        </h1>
        <p style={{ margin: "6px 0 24px", fontSize: 15, color: "#7A6F62", fontWeight: 500 }}>
          {session.email}
        </p>

        {status ? (
          <Notice tone="success" className="mt-6">
            {status === "verified" && "이메일 확인이 완료되었습니다."}
            {status === "password-set" && "비밀번호 설정이 완료되었습니다."}
            {status === "password-changed" && "비밀번호 변경이 완료되었습니다."}
            {status === "password-reset" && "비밀번호 재설정이 완료되었습니다."}
          </Notice>
        ) : null}
        {error === "password" ? (
          <Notice tone="error" className="mt-6">비밀번호가 일치하지 않습니다</Notice>
        ) : null}
        {error === "weak" ? (
          <Notice tone="error" className="mt-6">비밀번호는 8자 이상이어야 합니다</Notice>
        ) : null}
        <div className="mt-8">
          <AccountTabs
            tabs={[
              {
                key: "profile",
                label: "프로필",
                content: (
                  <SoftCard className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-3xl">
                        {avatarDataUrl ? (
                          <Image src={avatarDataUrl} alt="프로필 사진" width={64} height={64} className="h-16 w-16 rounded-full object-cover" unoptimized />
                        ) : (
                          avatar.emoji
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">내 프로필</h2>
                        <p className="mt-2 text-base leading-7 text-gray-600">{nickname}</p>
                        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${providerBadge.bg} ${providerBadge.text}`}>{providerBadge.label} 계정</span>
                      </div>
                    </div>
                    <AccountProfileForm initialNickname={nickname} initialAvatarKey={avatarKey} initialFontSize={fontSize} initialAvatarDataUrl={avatarDataUrl} />
                    <div className="flex justify-end border-t border-gray-200 pt-4">
                      <form method="post" action="/api/auth/logout">
                        <Button type="submit" variant="outline" size="sm">로그아웃</Button>
                      </form>
                    </div>
                  </SoftCard>
                )
              },
              {
                key: "interests",
                label: "관심사",
                content: (
                  <SoftCard className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">관심주제 설정</h2>
                      <p className="mt-3 text-base leading-7 text-gray-600">지금 받고 있는 주제와 시간을 바꿀 수 있습니다.</p>
                    </div>
                    <AccountInterestsForm
                      initialInterests={selectedInterests}
                      initialSubInterests={subInterests}
                      initialDeliveryTime={user?.delivery_time ?? "08:00"}
                      mainInterests={interestConfig.mainInterests}
                      subInterestOptions={interestConfig.subInterests}
                      interestLabels={interestConfig.labels}
                    />
                  </SoftCard>
                )
              },
              {
                key: "delivery",
                label: "알림",
                content: (
                  <SoftCard className="space-y-5">
                    <AccountDeliveryForm
                      initialChannel={initialChannel}
                      initialEmail={session.email}
                      initialMarketingConsent={hasMarketingConsent}
                    />
                  </SoftCard>
                )
              },
              {
                key: "password",
                label: "비밀번호",
                content: !user?.has_password ? (
                  status === "password-set" ? (
                    <SoftCard className="space-y-5">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">비밀번호 설정이 완료되었습니다.</h2>
                        <p className="mt-3 text-base leading-7 text-gray-600">이제부터는 이메일 확인 없이 더 빠르게 로그인하실 수 있습니다.</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link href="/account" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-base font-semibold text-white transition hover:bg-gray-800">
                          내 프로필 가기
                        </Link>
                      </div>
                    </SoftCard>
                  ) : (
                    <SoftCard className="space-y-5">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">다음부터 이메일 확인 없이 로그인하시겠어요?</h2>
                        <p className="mt-3 text-base leading-7 text-gray-600">비밀번호를 설정하면 더 빠르게 로그인하실 수 있습니다.</p>
                      </div>
                      <form method="post" action="/api/auth/password/set" className="grid gap-4">
                        <Field>
                          <FieldLabel>새 비밀번호를 입력해주세요</FieldLabel>
                          <TextInput type="password" name="password" minLength={8} autoComplete="new-password" required />
                        </Field>
                        <Button type="submit" size="lg" fullWidth>비밀번호 설정하기</Button>
                      </form>
                    </SoftCard>
                  )
                ) : (
                  <SoftCard className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">비밀번호 변경</h2>
                      <p className="mt-3 text-base leading-7 text-gray-600">현재 비밀번호를 입력해주세요</p>
                    </div>
                    <form method="post" action="/api/auth/password/change" className="grid gap-4">
                      <Field>
                        <FieldLabel>현재 비밀번호를 입력해주세요</FieldLabel>
                        <TextInput type="password" name="currentPassword" autoComplete="current-password" required />
                      </Field>
                      <Field>
                        <FieldLabel>새 비밀번호를 입력해주세요</FieldLabel>
                        <TextInput type="password" name="newPassword" minLength={8} autoComplete="new-password" required />
                      </Field>
                      <Button type="submit" size="lg" fullWidth>비밀번호 변경</Button>
                    </form>
                  </SoftCard>
                )
              },
              {
                key: "terms",
                label: "약관",
                content: (
                  <>
                    <AccountTabs
                      tabs={[
                        {
                          key: "service-terms",
                          label: "이용약관",
                          content: (
                            <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-5">
                              <section className="space-y-3">
                                <h3 className="text-xl font-bold text-gray-900">{TERMS_SECTIONS[0].title}</h3>
                                <div className="space-y-2">
                                  {TERMS_SECTIONS[0].body.map((paragraph) => (
                                    <p key={paragraph} className="text-base leading-7 text-gray-600">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </section>
                            </div>
                          )
                        },
                        {
                          key: "privacy-policy",
                          label: "개인정보처리방침",
                          content: (
                            <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-5">
                              <section className="space-y-3">
                                <h3 className="text-xl font-bold text-gray-900">{TERMS_SECTIONS[1].title}</h3>
                                <div className="space-y-2">
                                  {TERMS_SECTIONS[1].body.map((paragraph) => (
                                    <p key={paragraph} className="text-base leading-7 text-gray-600">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </section>
                            </div>
                          )
                        }
                      ]}
                    />
                    <AccountDeleteDialog hasPassword={Boolean(user?.has_password)} />
                  </>
                )
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
