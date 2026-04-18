import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { CompleteShareButton } from "@/components/complete-share-button";
import { getCurrentUserSession } from "@/lib/auth/user-session";
import { findUserById } from "@/lib/mongodb/user-data";
import { isAvatarKey } from "@/lib/profile";
import { decodeShareState, encodeShareState, formatInterestSummary } from "@/lib/share";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ interest?: string | string[]; sub?: string | string[]; nickname?: string | string[]; avatar?: string | string[] }>;
};

export default async function CompletePage({ searchParams }: PageProps) {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3100";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const session = await getCurrentUserSession();
  const user = session ? await findUserById(session.id) : null;
  const profileUser = user as
    | (typeof user & {
        avatar_key?: string | null;
        nickname?: string | null;
      })
    | null;
  const shareState = decodeShareState(await searchParams);
  const nickname = typeof profileUser?.nickname === "string" && profileUser.nickname.trim() ? profileUser.nickname : undefined;
  const avatarKey = isAvatarKey(profileUser?.avatar_key) ? profileUser.avatar_key : undefined;
  const enrichedShareState = {
    ...shareState,
    profile: nickname ? { nickname, avatarKey } : shareState.profile,
  };
  const shareQuery = encodeShareState(enrichedShareState);
  const shareUrl = new URL(shareQuery ? `/invite?${shareQuery}` : "/invite", `${protocol}://${host}`).toString();
  const interestSummary = formatInterestSummary(enrichedShareState);

  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "60px 20px 80px" }}>
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          background: "#FFFBF5",
          borderRadius: 24,
          border: "1.5px solid #F2E6D7",
          padding: "40px 24px",
          textAlign: "center",
          boxShadow: "0 4px 14px rgba(229, 124, 35, 0.08)",
        }}
      >
        {/* 체크 아이콘 */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            background: "#E8F5EC",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2E7D3F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "#FFF2E3",
            borderRadius: 999,
            border: "1.5px solid #FFD1A3",
            fontSize: 13,
            fontWeight: 800,
            color: "#B2570F",
            marginBottom: 14,
          }}
        >
          가입 완료
        </div>
        <h1
          style={{
            margin: "0 0 14px",
            fontSize: 28,
            fontWeight: 900,
            color: "#1F1A14",
            letterSpacing: "-0.03em",
            lineHeight: 1.3,
          }}
          className="md:!text-[34px]"
        >
          신청이 접수되었습니다
        </h1>
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 16,
            lineHeight: 1.7,
            color: "#4A4037",
            fontWeight: 500,
          }}
        >
          오늘의 첫 브리핑을 방금 메일로 보냈습니다.
          <br />
          선택하신 시간은 <b style={{ color: "#1F1A14" }}>내일부터</b> 적용돼요.
        </p>
        <p style={{ margin: "0 0 22px", fontSize: 14, color: "#7A6F62", fontWeight: 500 }}>
          메일이 보이지 않으면 프로모션함이나 스팸함도 확인해주세요.
        </p>

        {interestSummary ? (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #F2E6D7",
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              fontSize: 14,
              color: "#4A4037",
              fontWeight: 600,
              lineHeight: 1.6,
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: "#7A6F62", letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" }}>
              공유 링크 정보
            </div>
            <div>
              {interestSummary} 주제가 공유 링크에 함께 담겨 전달됩니다.
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              minHeight: 56,
              padding: "0 24px",
              borderRadius: 14,
              background: "#E57C23",
              color: "#fff",
              fontSize: 16,
              fontWeight: 900,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              boxShadow: "0 6px 16px rgba(229, 124, 35, 0.35)",
              letterSpacing: "-0.01em",
            }}
          >
            오늘의 소식 보기
          </Link>
          <CompleteShareButton shareUrl={shareUrl} interestSummary={interestSummary} />
        </div>
      </div>
    </div>
  );
}
