"use client";

import Link from "next/link";
import { SeniorTopBar } from "@/components/senior/common";
import { useFontScale } from "@/components/senior/font-scale";
import { SpeakerIcon, MailIcon } from "@/components/senior/icons";
import { PCLanding } from "@/components/senior/pc-landing";
import { CATEGORY_META, type CategoryKey } from "@/components/senior/tokens";
import { useIsDesktop } from "@/components/senior/use-media-query";

export default function SeniorLanding() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <PCLanding />;
  return <MobileLanding />;
}

function MobileLanding() {
  const { fontScale: s } = useFontScale();

  const previews: { category: CategoryKey; title: string }[] = [
    { category: "건강", title: "오늘 아침, 따뜻한 물 한 잔이 혈압에 미치는 영향" },
    { category: "돈", title: "올해 건강보험료 기준이 바뀝니다. 꼭 확인하세요" },
    { category: "실생활", title: "봄철 알레르기, 집에서 간단히 막는 세 가지 방법" },
  ];

  return (
    <div style={{ background: "#FFFBF5", minHeight: "100%", paddingBottom: 40 }}>
      <SeniorTopBar logoOnly />

      <section style={{ padding: "28px 20px 20px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "#FFF",
            borderRadius: 999,
            border: "2px solid #F5DDC2",
            fontSize: 14 * s,
            fontWeight: 700,
            color: "#B2570F",
            marginBottom: 22,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#E57C23" }} />
          매일 아침 7시 배달
        </div>

        <h1
          style={{
            fontSize: 34 * s,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
            color: "#1F1A14",
            margin: "0 0 18px",
          }}
        >
          <span
            style={{
              background: "linear-gradient(180deg, transparent 60%, #FFD9B0 60%)",
              padding: "0 4px",
            }}
          >
            세 줄
          </span>
          이면
          <br />
          오늘 하루가 보입니다
        </h1>

        <p
          style={{
            fontSize: 17 * s,
            lineHeight: 1.65,
            color: "#4A4037",
            margin: "0 0 28px",
            fontWeight: 500,
          }}
        >
          긴 뉴스 대신 딱 세 줄.
          <br />
          어려운 말은 쉽게 풀어드리고,
          <br />
          눈이 피곤하면 <b style={{ color: "#E57C23" }}>소리로도 들을 수 있습니다.</b>
        </p>

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            border: "2px solid #F2E6D7",
            padding: 20,
            margin: "0 auto",
            boxShadow: "0 4px 14px rgba(229, 124, 35, 0.08)",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13 * s,
                fontWeight: 800,
                color: "#1F1A14",
                letterSpacing: "-0.01em",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#E57C23" }} />
              오늘의 세 줄 · 4월 18일
            </div>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 999,
                background: "#FFF2E3",
                border: "1.5px solid #FFD1A3",
                color: "#B2570F",
                fontWeight: 800,
                fontSize: 13 * s,
                cursor: "pointer",
              }}
            >
              <SpeakerIcon size={16 * s} /> 듣기
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
                    width: 36 * s,
                    height: 36 * s,
                    borderRadius: 10,
                    background: meta.bg,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16 * s,
                    fontWeight: 900,
                    color: meta.color,
                  }}
                >
                  {i + 1}
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
                      fontSize: 12 * s,
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    <span>{meta.emoji}</span> {p.category}
                  </div>
                  <div
                    style={{
                      fontSize: 15 * s,
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
      </section>

      <section style={{ padding: "8px 20px 36px" }}>
        <Link
          href="/senior/signup"
          style={{
            width: "100%",
            minHeight: 60,
            background: "#E57C23",
            color: "#fff",
            borderRadius: 16,
            fontSize: 19 * s,
            fontWeight: 900,
            letterSpacing: "-0.01em",
            boxShadow: "0 6px 16px rgba(229, 124, 35, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <MailIcon size={20 * s} />
          무료로 구독 신청하기
        </Link>
        <p
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: 14 * s,
            color: "#7A6F62",
            fontWeight: 500,
          }}
        >
          1분이면 충분합니다 · 언제든 해지 가능
        </p>
      </section>

      <section
        style={{
          margin: "0 20px",
          padding: "28px 20px",
          background: "#fff",
          borderRadius: 24,
          border: "2px solid #F2E6D7",
        }}
      >
        <h2
          style={{
            fontSize: 22 * s,
            fontWeight: 900,
            color: "#1F1A14",
            margin: "0 0 6px",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          이렇게 쉽습니다
        </h2>
        <p
          style={{
            fontSize: 14 * s,
            color: "#7A6F62",
            margin: "0 0 22px",
            textAlign: "center",
          }}
        >
          복잡한 뉴스, 세줄아침이 대신 읽어드립니다
        </p>

        {[
          { n: "1", t: "아침 7시 도착", d: "이메일로 \n짧은 브리핑이 옵니다" },
          { n: "2", t: "세 줄로 핵심만", d: "긴 기사 대신 \n핵심만 세 줄" },
          { n: "3", t: "소리로 듣기", d: "버튼 한 번이면 \n귀로 편하게 듣습니다" },
          { n: "4", t: "더 보고 싶으면", d: "관심 분야만 \n골라서 읽을 수 있습니다" },
        ].map((it) => (
          <div
            key={it.n}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 0",
              borderTop: it.n === "1" ? "none" : "1px solid #F5EEE2",
            }}
          >
            <div
              style={{
                width: 44 * s,
                height: 44 * s,
                borderRadius: 14,
                background: "#FFF2E3",
                color: "#B2570F",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20 * s,
                fontWeight: 900,
              }}
            >
              {it.n}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 17 * s,
                  fontWeight: 800,
                  color: "#1F1A14",
                  letterSpacing: "-0.01em",
                  marginBottom: 2,
                }}
              >
                {it.t}
              </div>
              <div
                style={{
                  fontSize: 14 * s,
                  color: "#4A4037",
                  whiteSpace: "pre-line",
                  lineHeight: 1.5,
                }}
              >
                {it.d}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section style={{ padding: "32px 20px 16px" }}>
        <h2
          style={{
            fontSize: 20 * s,
            fontWeight: 900,
            color: "#1F1A14",
            margin: "0 0 14px",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          관심 분야만 골라 받으세요
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {(Object.entries(CATEGORY_META) as [CategoryKey, typeof CATEGORY_META[CategoryKey]][]).map(
            ([k, m]) => (
              <div
                key={k}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "#fff",
                  border: `2px solid ${m.color}22`,
                  fontSize: 16 * s,
                  fontWeight: 800,
                  color: "#1F1A14",
                }}
              >
                <span style={{ fontSize: 20 * s }}>{m.emoji}</span> {k}
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
