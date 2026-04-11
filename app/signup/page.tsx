import type { Metadata } from "next";

import { SignupForm } from "@/components/signup-form";
import { PageIntro } from "@/components/ui/panel";
import { isGoogleOauthConfigured, isKakaoOauthConfigured } from "@/lib/auth/kakao-oauth";
import { getInterestConfig } from "@/lib/content/interest-config";
import { decodeShareState } from "@/lib/share";

export const metadata: Metadata = {
  title: "무료 구독 신청",
  description: "건강, 돈, 실생활, 뉴스, 관계 중 관심사 3가지를 고르면 매일 아침 세 줄 브리핑을 이메일로 보내드립니다.",
  openGraph: {
    title: "세줄아침 무료 구독 신청",
    description: "관심사를 고르고 매일 아침 세 줄 브리핑을 받아보세요.",
  },
};

type PageProps = {
  searchParams: Promise<{ interest?: string | string[]; sub?: string | string[]; email?: string; oauth?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const shareState = decodeShareState(resolvedSearchParams);
  const interestConfig = await getInterestConfig();
  const defaultEmail = typeof resolvedSearchParams.email === "string" ? resolvedSearchParams.email : "";
  const kakaoEnabled = isKakaoOauthConfigured();
  const googleEnabled = isGoogleOauthConfigured();

  return (
    <div className="app-shell py-10 md:py-16" style={{ fontSize: "16px" }}>
      <PageIntro
        eyebrow="SIGN UP"
        title="아침을 가볍게 시작할 준비를 해보세요."
        description="관심사 세 가지와 이메일, 원하는 시간만 정하면 됩니다. 가입 후에는 매일 아침 세 줄 요약이 도착합니다."
        className="mb-8 md:mb-12"
      />
      <SignupForm
        initialInterests={shareState.interests}
        initialSubInterests={shareState.subInterests}
        defaultEmail={defaultEmail}
        kakaoEnabled={kakaoEnabled}
        googleEnabled={googleEnabled}
        mainInterests={interestConfig.mainInterests}
        subInterestOptions={interestConfig.subInterests}
        interestLabels={interestConfig.labels}
      />
    </div>
  );
}
