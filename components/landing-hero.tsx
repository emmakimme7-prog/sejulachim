import Link from "next/link";

import { HeroListenButton } from "@/components/hero-listen-button";

type PreviewItem = {
  category: string;
  title: string;
  slug: string;
  short_summary?: string;
};

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF" },
};

export function LandingHero({ previews }: { previews: PreviewItem[] }) {
  return (
    <div style={{ background: "#FFFBF5", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "40px 20px 48px",
        }}
        className="md:!px-9 md:!py-[56px] md:!grid md:!grid-cols-[1.1fr_1fr] md:!gap-12 md:!items-center"
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              background: "#fff",
              borderRadius: 999,
              border: "2px solid #F5DDC2",
              fontSize: 14,
              fontWeight: 800,
              color: "#B2570F",
              marginBottom: 22,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#E57C23" }} />
            매일 아침 7시 · 이메일로 도착
          </div>
          <h1
            style={{
              margin: "0 0 18px",
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              color: "#1F1A14",
            }}
            className="md:!text-[52px] xl:!text-[56px]"
          >
            아침에{" "}
            <span
              style={{
                background: "linear-gradient(180deg, transparent 60%, #FFD9B0 60%)",
                padding: "0 4px",
              }}
            >
              세 줄
            </span>
            이면<br />
            오늘 하루가 보입니다
          </h1>
          <p
            style={{
              margin: "0 0 28px",
              fontSize: 17,
              lineHeight: 1.7,
              color: "#4A4037",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
            className="md:!text-[18px]"
          >
            긴 뉴스 대신 딱 세 줄.
            <br />
            어려운 말은 쉽게 풀어드리고,
            <br />
            눈이 피곤하면 <b style={{ color: "#E57C23" }}>소리로도 들을 수 있습니다.</b>
          </p>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                minHeight: 60,
                padding: "0 28px",
                borderRadius: 16,
                background: "#E57C23",
                color: "#fff",
                fontSize: 18,
                fontWeight: 900,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 6px 16px rgba(229, 124, 35, 0.35)",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M2 7l10 6 10-6" />
              </svg>
              무료 구독 신청하기
            </Link>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 22, flexWrap: "wrap" }}>
            {["매일 아침 7:00", "무료", "1분이면 가입", "언제든 해지"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: "#E8F5EC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2E7D3F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: "#4A4037", fontWeight: 700 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 세줄 미리보기 카드 */}
        {previews.length > 0 ? (
          <div style={{ marginTop: 32 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: 24,
                border: "2px solid #F2E6D7",
                boxShadow: "0 20px 50px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 14,
                  borderBottom: "1px solid #F2E6D7",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#1F1A14",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "#E57C23" }} />
                  오늘의 세줄 미리보기
                </div>
                <HeroListenButton previews={previews} />
              </div>
              {previews.map((item, idx) => {
                const meta = CATEGORY_META[item.category] ?? { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };
                return (
                  <Link
                    key={item.slug}
                    href={`/archive/${item.slug}`}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "14px 0",
                      borderTop: idx === 0 ? "none" : "1px solid #F5EEE2",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: meta.bg,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: 900,
                        color: meta.color,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 10px",
                          borderRadius: 999,
                          background: meta.bg,
                          color: meta.color,
                          fontSize: 12,
                          fontWeight: 800,
                          marginBottom: 6,
                        }}
                      >
                        <span>{meta.emoji}</span> {item.category}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          lineHeight: 1.45,
                          fontWeight: 800,
                          color: "#1F1A14",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {item.title}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {/* 이렇게 쉽습니다 */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 20px 48px" }}>
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 28,
            fontWeight: 900,
            color: "#1F1A14",
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
          className="md:!text-[32px]"
        >
          이렇게 쉽습니다
        </h2>
        <p style={{ margin: "0 0 32px", fontSize: 15, color: "#7A6F62", fontWeight: 500, textAlign: "center" }}>
          복잡한 뉴스, 세줄아침이 대신 읽어드립니다
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { emoji: "📬", t: "아침 7시 도착", d: "이메일로\n짧은 브리핑이 옵니다" },
            { emoji: "✏️", t: "세 줄로 핵심만", d: "긴 기사 대신\n핵심만 세 줄" },
            { emoji: "🎧", t: "읽기 싫으면 듣기", d: "아침 준비하면서\n라디오처럼 듣습니다" },
            { emoji: "📚", t: "더 보고 싶으면", d: "관심 분야만\n골라서 읽을 수 있습니다" },
          ].map((it) => (
            <div
              key={it.t}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: "24px 20px",
                border: "2px solid #F2E6D7",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "#FFF2E3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  marginBottom: 14,
                }}
                aria-hidden="true"
              >
                {it.emoji}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.02em", marginBottom: 6 }}>
                {it.t}
              </div>
              <div style={{ fontSize: 14, color: "#4A4037", whiteSpace: "pre-line", lineHeight: 1.6, fontWeight: 500 }}>
                {it.d}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 관심 분야 */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 20px 48px", textAlign: "center" }}>
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: 24,
            fontWeight: 900,
            color: "#1F1A14",
            letterSpacing: "-0.03em",
          }}
          className="md:!text-[28px]"
        >
          관심 분야만 골라 받으세요
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#7A6F62", fontWeight: 500 }}>
          체크만 하시면 딱 맞는 소식만 도착합니다
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {Object.entries(CATEGORY_META).map(([cat, meta]) => (
            <div
              key={cat}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                borderRadius: 999,
                background: "#fff",
                border: `2px solid ${meta.color}22`,
                fontSize: 15,
                fontWeight: 800,
                color: "#1F1A14",
              }}
            >
              <span style={{ fontSize: 18 }}>{meta.emoji}</span> {cat}
            </div>
          ))}
        </div>
      </section>

      {/* 하단 CTA */}
      <section
        style={{
          background: "linear-gradient(135deg, #E57C23 0%, #D16612 100%)",
          padding: "48px 20px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "-0.03em",
          }}
          className="md:!text-[32px]"
        >
          내일 아침부터 시작하세요
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 15, fontWeight: 500, opacity: 0.95 }}>
          지금 구독하면, 내일 아침 첫 번째 세줄이 도착합니다
        </p>
        <Link
          href="/signup"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            minHeight: 60,
            padding: "0 28px",
            borderRadius: 16,
            background: "#fff",
            color: "#B2570F",
            fontSize: 18,
            fontWeight: 900,
            textDecoration: "none",
            letterSpacing: "-0.01em",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M2 7l10 6 10-6" />
          </svg>
          무료 구독 신청하기
        </Link>
      </section>
    </div>
  );
}
