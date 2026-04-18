import type { Metadata } from "next";

import { SignupForm } from "@/components/signup-form";
import { Notice } from "@/components/ui/notice";
import { isGoogleOauthConfigured, isKakaoOauthConfigured, isNaverOauthConfigured } from "@/lib/auth/kakao-oauth";
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
  const oauthProvider = typeof resolvedSearchParams.oauth === "string" ? resolvedSearchParams.oauth : "";
  const oauthLabels: Record<string, string> = { google: "구글", kakao: "카카오", naver: "네이버" };
  const kakaoEnabled = isKakaoOauthConfigured();
  const googleEnabled = isGoogleOauthConfigured();
  const naverEnabled = isNaverOauthConfigured();

  return (
    <div className="py-10 md:py-14" style={{ background: "#F0EEE9", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 24px", padding: "0 20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "#fff",
            borderRadius: 999,
            border: "2px solid #F5DDC2",
            fontSize: 13,
            fontWeight: 700,
            color: "#B2570F",
            marginBottom: 16,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#E57C23" }} />
          무료 구독 신청
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          아침을 가볍게 시작할 준비를 해보세요.
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
          관심사 3개와 이메일만 있으면 됩니다.
        </p>
      </div>

      {oauthProvider && oauthLabels[oauthProvider] ? (
        <div style={{ maxWidth: 560, margin: "0 auto 16px", padding: "0 20px" }}>
          <Notice tone="info">
            {oauthLabels[oauthProvider]} 계정으로 가입되지 않은 이메일입니다. 관심사를 선택하고 가입을 완료해주세요.
          </Notice>
        </div>
      ) : null}

      <div style={{ padding: "0 20px" }}>
        <SignupForm
          initialInterests={shareState.interests}
          initialSubInterests={shareState.subInterests}
          defaultEmail={defaultEmail}
          kakaoEnabled={kakaoEnabled}
          googleEnabled={googleEnabled}
          naverEnabled={naverEnabled}
          mainInterests={interestConfig.mainInterests}
          subInterestOptions={interestConfig.subInterests}
          interestLabels={interestConfig.labels}
        />
      </div>
    </div>
  );
}
