"use client";

import Link from "next/link";
import { useFontScale } from "./font-scale";
import { PCHeader } from "./pc-header";
import { SpeakerIcon } from "./icons";
import { CATEGORY_META, type CategoryKey } from "./tokens";

export function PCLanding() {
  const { fontScale: s } = useFontScale();

  const previews: { category: CategoryKey; title: string }[] = [
    { category: "건강", title: "따뜻한 물 한 잔이 아침 혈압을 낮춘다는 연구" },
    { category: "돈", title: "올해 건강보험료 기준이 바뀝니다. 꼭 확인하세요" },
    { category: "실생활", title: "봄철 알레르기, 집에서 간단히 막는 세 가지" },
  ];

  return (
    <div style={{ background: "#FFFBF5", minHeight: "100%" }}>
      <PCHeader loggedIn={false} />

      {/* Hero */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "56px 36px 48px",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 48,
          alignItems: "center",
        }}
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
              fontSize: 14 * s,
              fontWeight: 800,
              color: "#B2570F",
              marginBottom: 24,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#E57C23" }} />
            매일 아침 7시 · 이메일로 도착
          </div>
          <h1
            style={{
              margin: "0 0 20px",
              fontSize: 56 * s,
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              color: "#1F1A14",
            }}
          >
            어르신을 위한
            <br />
            <span style={{ color: "#E57C23" }}>세 줄</span>짜리 아침 신문
          </h1>
          <p
            style={{
              margin: "0 0 32px",
              fontSize: 18 * s,
              lineHeight: 1.7,
              color: "#4A4037",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            너무 많은 뉴스, 너무 긴 기사 대신.
            <br />꼭 알아야 할 소식만 <b style={{ color: "#1F1A14" }}>세 줄로 정리</b>해서
            <br />
            매일 아침 이메일로 보내드립니다.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Link
              href="/senior/signup"
              style={{
                minHeight: 60,
                padding: "0 32px",
                borderRadius: 14,
                background: "#E57C23",
                color: "#fff",
                fontSize: 18 * s,
                fontWeight: 900,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                boxShadow: "0 8px 20px rgba(229,124,35,0.3)",
                whiteSpace: "nowrap",
              }}
            >
              무료로 구독 시작하기 →
            </Link>
            <Link
              href="/senior/home"
              style={{
                minHeight: 60,
                padding: "0 24px",
                borderRadius: 14,
                background: "transparent",
                color: "#1F1A14",
                border: "2px solid #E8DCC7",
                fontSize: 16 * s,
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              샘플 먼저 보기
            </Link>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 28, alignItems: "center" }}>
            {["매일 아침 7:00", "무료", "1분이면 가입"].map((t) => (
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
                <span style={{ fontSize: 14 * s, color: "#4A4037", fontWeight: 700 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 이메일 샘플 카드 */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 20px 50px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
              border: "1px solid #F2E6D7",
              transform: "rotate(-1deg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingBottom: 16,
                borderBottom: "1px solid #F2E6D7",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#E57C23",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 22,
                }}
              >
                세
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#1F1A14" }}>세줄아침</div>
                <div style={{ fontSize: 12, color: "#7A6F62", fontWeight: 600 }}>
                  4월 18일 토 · 아침 7:00
                </div>
              </div>
              <button
                style={{
                  marginLeft: "auto",
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "#FFF2E3",
                  border: "1.5px solid #FFD1A3",
                  color: "#B2570F",
                  fontWeight: 800,
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <SpeakerIcon size={14} /> 듣기
              </button>
            </div>

            {previews.map((p, i) => {
              const meta = CATEGORY_META[p.category];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "14px 0",
                    borderTop: i === 0 ? "none" : "1px solid #F5EEE2",
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
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
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
                      <span>{meta.emoji}</span> {p.category}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        lineHeight: 1.45,
                        fontWeight: 700,
                        color: "#1F1A14",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {p.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "48px 36px 72px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 32 * s,
            fontWeight: 900,
            color: "#1F1A14",
            letterSpacing: "-0.03em",
            margin: "0 0 10px",
          }}
        >
          관심 분야만 골라 받으세요
        </h2>
        <p style={{ margin: "0 0 32px", fontSize: 16 * s, color: "#7A6F62", fontWeight: 500 }}>
          체크만 하시면 딱 맞는 소식만 도착합니다
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {(Object.entries(CATEGORY_META) as [CategoryKey, typeof CATEGORY_META[CategoryKey]][]).map(
            ([k, m]) => (
              <div
                key={k}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 26px",
                  borderRadius: 999,
                  background: "#fff",
                  border: `2px solid ${m.color}22`,
                  fontSize: 18 * s,
                  fontWeight: 800,
                  color: "#1F1A14",
                }}
              >
                <span style={{ fontSize: 24 }}>{m.emoji}</span> {k}
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
