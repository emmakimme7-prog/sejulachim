"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FloatingFontToggle } from "@/components/senior/common";
import { useFontScale } from "@/components/senior/font-scale";
import { BackIcon } from "@/components/senior/icons";
import { CATEGORY_META, type CategoryKey } from "@/components/senior/tokens";

const INTEREST_DESCS: Record<CategoryKey, string> = {
  건강: "혈압, 당뇨, 건강검진 등",
  돈: "연금, 보험, 세금 정보",
  실생활: "집, 가전, 계절 팁",
  뉴스: "꼭 알아야 할 소식",
  관계: "가족, 친구, 마음 건강",
};

function GoogleMark({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: "#fff",
        border: "1px solid #E8DCC7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    </div>
  );
}

function KakaoMark({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: "#FEE500",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#3C1E1E">
        <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.72 1.74 5.12 4.39 6.51l-.9 3.3c-.08.29.23.52.48.37l3.93-2.6c.69.09 1.39.14 2.1.14 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
      </svg>
    </div>
  );
}

export default function SeniorSignup() {
  const { fontScale: s } = useFontScale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<Set<CategoryKey>>(new Set(["건강", "돈"]));

  const toggleInterest = (k: CategoryKey) => {
    const next = new Set(interests);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setInterests(next);
  };

  return (
    <div style={{ background: "#FFFBF5", minHeight: "100vh", paddingBottom: 120 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: "#fff",
          borderBottom: "1px solid #F2E6D7",
        }}
      >
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          style={{
            minHeight: 44,
            padding: "0 10px",
            display: "inline-flex",
            alignItems: "center",
            background: "transparent",
            border: "none",
            color: "#1F1A14",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          aria-label="뒤로"
        >
          <BackIcon size={22} color="#1F1A14" />
        </button>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#1F1A14" }}>무료 구독 신청</div>
        <div style={{ width: 44 }} />
      </div>

      <div style={{ padding: "18px 22px 6px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[1, 2].map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 999,
                background: n <= step ? "#E57C23" : "#F2E6D7",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 13 * s, color: "#7A6F62", fontWeight: 700 }}>{step}/2 단계</div>
        <h1
          style={{
            margin: "6px 0 8px",
            fontSize: 26 * s,
            fontWeight: 900,
            color: "#1F1A14",
            letterSpacing: "-0.03em",
            lineHeight: 1.3,
          }}
        >
          {step === 1 ? "어떤 소식이 궁금하세요?" : "어디로 받아볼까요?"}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15 * s,
            color: "#4A4037",
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          {step === 1
            ? "관심 있는 분야를 골라 주세요. 여러 개 선택할 수 있습니다."
            : "매일 아침 7시에 세 줄 브리핑을 보내드립니다."}
        </p>
      </div>

      <div style={{ padding: "18px 22px 40px" }}>
        {step === 1 && (
          <div style={{ display: "grid", gap: 10 }}>
            {(Object.entries(CATEGORY_META) as [CategoryKey, typeof CATEGORY_META[CategoryKey]][]).map(
              ([k, m]) => {
                const on = interests.has(k);
                return (
                  <button
                    key={k}
                    onClick={() => toggleInterest(k)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "18px 18px",
                      borderRadius: 16,
                      background: "#fff",
                      border: on ? `2.5px solid ${m.color}` : "2px solid #E8DCC7",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: m.bg,
                        fontSize: 26,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {m.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 18 * s,
                          fontWeight: 900,
                          color: "#1F1A14",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          fontSize: 13 * s,
                          color: "#7A6F62",
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        {INTEREST_DESCS[k]}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        background: on ? m.color : "#F5EEE2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {on && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 18px",
                  minHeight: 60,
                  borderRadius: 14,
                  background: "#FEE500",
                  color: "#3C1E1E",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 16 * s,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                }}
              >
                <KakaoMark size={28} />
                <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>
                  카카오로 시작하기
                </span>
              </button>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 18px",
                  minHeight: 60,
                  borderRadius: 14,
                  background: "#03C75A",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 16 * s,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#03C75A",
                    fontWeight: 900,
                    fontSize: 16,
                    letterSpacing: "-0.05em",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  N
                </div>
                <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>
                  네이버로 시작하기
                </span>
              </button>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 18px",
                  minHeight: 60,
                  borderRadius: 14,
                  background: "#fff",
                  color: "#1F1A14",
                  border: "2px solid #E8DCC7",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 16 * s,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                }}
              >
                <GoogleMark size={28} />
                <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>
                  구글로 시작하기
                </span>
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div style={{ flex: 1, height: 1, background: "#E8DCC7" }} />
              <span style={{ fontSize: 12 * s, color: "#9C907F", fontWeight: 700 }}>
                또는 이메일로
              </span>
              <div style={{ flex: 1, height: 1, background: "#E8DCC7" }} />
            </div>

            <label
              style={{
                display: "block",
                fontSize: 14 * s,
                fontWeight: 800,
                color: "#1F1A14",
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}
            >
              이메일 주소
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="예) hong@naver.com"
              style={{
                width: "100%",
                minHeight: 60,
                padding: "0 18px",
                background: "#fff",
                border: "2px solid #E8DCC7",
                borderRadius: 14,
                fontSize: 18 * s,
                fontWeight: 600,
                color: "#1F1A14",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <p
              style={{
                marginTop: 12,
                fontSize: 13 * s,
                color: "#7A6F62",
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              ℹ️ 어떤 방법으로 가입하셔도 정보는 브리핑 발송 외에 사용되지 않습니다.
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "14px 22px 28px",
          background: "#FFFBF5",
          borderTop: "1px solid #F2E6D7",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => {
            if (step < 2) setStep(step + 1);
          }}
          style={{
            width: "100%",
            minHeight: 60,
            background: "#E57C23",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            fontSize: 18 * s,
            fontWeight: 900,
            letterSpacing: "-0.01em",
            boxShadow: "0 6px 16px rgba(229, 124, 35, 0.35)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {step === 2 ? (email ? "이메일로 구독 시작" : "다음") : "다음"}
        </button>
      </div>

      <FloatingFontToggle />
    </div>
  );
}
