import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ token?: string; status?: string }>;
};

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token, status } = await searchParams;

  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "60px 20px 80px" }}>
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "#FFFBF5",
          borderRadius: 24,
          border: "1.5px solid #F2E6D7",
          padding: "36px 26px",
          textAlign: "center",
        }}
      >
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
          메일 수신 설정
        </div>
        <h1
          style={{
            margin: "0 0 14px",
            fontSize: 26,
            fontWeight: 900,
            color: "#1F1A14",
            letterSpacing: "-0.03em",
            lineHeight: 1.3,
          }}
        >
          {status === "done" ? "수신 해지 완료" : "메일 수신 해지"}
        </h1>

        {status === "done" ? (
          <p style={{ margin: "0 0 24px", fontSize: 16, color: "#4A4037", lineHeight: 1.7, fontWeight: 500 }}>
            수신 해지가 완료되었습니다.
            <br />
            언제든 다시 가입하실 수 있습니다.
          </p>
        ) : token ? (
          <>
            <p style={{ margin: "0 0 24px", fontSize: 16, color: "#4A4037", lineHeight: 1.7, fontWeight: 500 }}>
              세줄아침 메일을 그만 받으시려면 아래 버튼을 눌러주세요.
            </p>
            <form method="post" action="/api/unsubscribe">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                style={{
                  minHeight: 56,
                  padding: "0 28px",
                  background: "#1F1A14",
                  color: "#fff",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "-0.01em",
                }}
              >
                수신 해지하기
              </button>
            </form>
          </>
        ) : (
          <p style={{ margin: "0 0 24px", fontSize: 16, color: "#4A4037", lineHeight: 1.7, fontWeight: 500 }}>
            유효한 수신 해지 토큰이 없습니다.
          </p>
        )}

        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 700,
            color: "#7A6F62",
            textDecoration: "underline",
            textUnderlineOffset: 4,
          }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
