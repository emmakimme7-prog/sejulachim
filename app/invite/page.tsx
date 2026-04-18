import Link from "next/link";

import { getAvatarOption } from "@/lib/profile";
import { decodeShareState, encodeShareState } from "@/lib/share";

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF" },
};

type PageProps = {
  searchParams: Promise<{ interest?: string | string[]; sub?: string | string[]; nickname?: string | string[]; avatar?: string | string[] }>;
};

export default async function InvitePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const shareState = decodeShareState(params);
  const signupQuery = encodeShareState(shareState);
  const signupHref = signupQuery ? `/signup?${signupQuery}` : "/signup";
  const avatar = getAvatarOption(shareState.profile?.avatarKey);

  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "40px 20px 60px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto 24px", textAlign: "center" }}>
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
            marginBottom: 14,
          }}
        >
          초대 받은 페이지
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          지인이 고른 주제를<br />살펴보세요
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
          아침마다 어떤 내용을 받아보는지 보고, 마음에 들면 바로 같은 흐름으로 신청하실 수 있어요.
        </p>
      </div>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#FFFBF5",
          borderRadius: 24,
          border: "1.5px solid #F2E6D7",
          padding: "28px 22px",
        }}
      >
        {shareState.profile?.nickname ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 18px",
              borderRadius: 16,
              background: "#fff",
              border: "1.5px solid #F2E6D7",
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                background: "#FFF2E3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                flexShrink: 0,
              }}
            >
              {avatar.emoji}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#B2570F", letterSpacing: "-0.01em", marginBottom: 4 }}>
                공유한 사람
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.02em" }}>
                {shareState.profile.nickname}
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ fontSize: 13, fontWeight: 900, color: "#E57C23", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>
          선택한 주제
        </div>
        {shareState.interests.length > 0 ? (
          <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            {shareState.interests.map((interest) => {
              const m = CATEGORY_META[interest] ?? { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };
              return (
                <div
                  key={interest}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 18px",
                    borderRadius: 14,
                    background: "#fff",
                    border: `2px solid ${m.color}22`,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: m.bg,
                      fontSize: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {m.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.02em" }}>
                      {interest}
                    </div>
                    <div style={{ fontSize: 13, color: "#7A6F62", fontWeight: 600, marginTop: 2 }}>
                      {shareState.subInterests[interest] ?? "세부 관심 선택 안 함"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: 15, color: "#7A6F62", marginBottom: 24 }}>
            공유된 주제가 없습니다. 기본 가입 화면으로 이동해 주세요.
          </p>
        )}

        <div
          style={{
            background: "linear-gradient(135deg, #FFF8EC 0%, #FFFBF5 100%)",
            borderRadius: 18,
            padding: 22,
            border: "1px solid #F2D7B5",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.02em", marginBottom: 6 }}>
            아침마다 세 줄의 뉴스 받아보기
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "#4A4037", lineHeight: 1.6, fontWeight: 500 }}>
            관심사 3개와 이메일만 있으면 됩니다. 오늘 신청하면 바로 첫 브리핑이 발송돼요.
          </p>
          <Link
            href={signupHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 56,
              padding: "0 24px",
              background: "#E57C23",
              color: "#fff",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 900,
              textDecoration: "none",
              letterSpacing: "-0.01em",
              boxShadow: "0 6px 16px rgba(229, 124, 35, 0.3)",
            }}
          >
            신청 페이지로 바로 가기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
