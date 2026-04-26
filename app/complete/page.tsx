import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUserSession } from "@/lib/auth/user-session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CompletePage() {
  const session = await getCurrentUserSession();

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
          오늘의 첫 브리핑을 방금 메일로 보냈어요.
          <br />
          <b style={{ color: "#1F1A14" }}>내일 아침 7시 30분</b>부터 매일 보내드려요.
        </p>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#7A6F62", fontWeight: 500 }}>
          메일이 보이지 않으면 프로모션함이나 스팸함도 확인해주세요.
        </p>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link
            href="/"
            style={{
              minHeight: 56,
              padding: "0 28px",
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
        </div>
      </div>
    </div>
  );
}
