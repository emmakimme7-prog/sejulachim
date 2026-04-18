"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFontScale } from "./font-scale";
import { PCHeader } from "./pc-header";
import { CoupangAdInline, COUPANG_PRODUCTS, Thumbnail } from "./common";
import {
  BackIcon,
  BookmarkIcon,
  ChevronRightIcon,
  PlayIcon,
  ShareIcon,
} from "./icons";
import { CATEGORY_META, type CategoryKey } from "./tokens";

export function PCDetail() {
  const { fontScale: s } = useFontScale();
  const router = useRouter();

  const article = {
    cat: "건강" as CategoryKey,
    sub: "혈압",
    title: "따뜻한 물 한 잔이 아침 혈압을 낮춘다는 연구",
    lines: [
      "일어나자마자 미지근한 물 200ml를 천천히 마시면, 밤새 끈끈해진 혈액이 부드러워집니다.",
      "차가운 물은 오히려 혈관을 수축시킬 수 있어서, 체온과 비슷한 35~40도가 가장 좋습니다.",
      "고혈압 약을 드시는 분은 약을 먹기 30분 전에 미리 마셔두면 효과가 더 크다고 합니다.",
    ],
    body: [
      "밤에 자는 동안 우리 몸은 수분을 계속 잃습니다. 6~8시간 숨을 쉬고 땀을 흘리는 사이, 보통 400~500ml 정도의 수분이 빠져나갑니다. 그래서 아침에 일어났을 때의 혈액은 하루 중 가장 끈끈한 상태이고, 이때가 혈압이 가장 높게 치솟는 시간대이기도 합니다.",
      "최근 일본 국립순환기병센터의 연구에 따르면, 아침 기상 후 10분 이내에 미지근한 물 한 잔(약 200ml)을 천천히 마신 그룹은 그렇지 않은 그룹보다 기상 후 1시간 내 수축기 혈압이 평균 5~8mmHg 낮게 유지되었습니다.",
      '중요한 포인트는 "차갑지 않게, 천천히"입니다. 차가운 물은 위장을 자극하고 순간적으로 혈관을 수축시킬 수 있습니다. 35~40도의 미지근한 물을 5분에 걸쳐 조금씩 나눠 마시는 것이 가장 좋습니다.',
    ],
    tips: [
      "일어나자마자 침대 옆에 보온병에 담아둔 미지근한 물 마시기",
      "고혈압 약은 물 마신 후 30분 뒤에 복용",
      "커피나 녹차보다 순수한 물 먼저",
    ],
    duration: "1분 30초",
  };
  const m = CATEGORY_META[article.cat];

  const related: { t: string; c: CategoryKey; d: string }[] = [
    { t: "고혈압 약, 아침에 먹을까 저녁에 먹을까", c: "건강", d: "1분 40초" },
    { t: "은퇴 후 의료비 줄이는 습관 3가지", c: "돈", d: "2분" },
    { t: "걷기 만보, 정말 건강에 좋을까", c: "건강", d: "1분 50초" },
  ];

  return (
    <div style={{ background: "#FFFBF5", minHeight: "100%" }}>
      <PCHeader activeTab="home" />

      <div
        style={{
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
          padding: "24px 36px 60px",
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 36,
        }}
      >
        <main>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              fontSize: 13 * s,
              color: "#7A6F62",
              fontWeight: 700,
            }}
          >
            <button
              onClick={() => router.back()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                borderRadius: 8,
                background: "transparent",
                color: "#4A4037",
                border: "none",
                fontSize: 14 * s,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <BackIcon size={18} /> 목록으로
            </button>
            <span style={{ color: "#D9CDB8" }}>/</span>
            <Link href="/senior/home" style={{ color: "#7A6F62", textDecoration: "none" }}>
              오늘의 소식
            </Link>
            <span style={{ color: "#D9CDB8" }}>/</span>
            <span style={{ color: "#B2570F", fontWeight: 800 }}>{article.cat}</span>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 999,
              background: m.bg,
              color: m.color,
              fontSize: 14 * s,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 18 }}>{m.emoji}</span>
            {article.cat} · {article.sub}
          </div>

          <h1
            style={{
              margin: "0 0 16px",
              fontSize: 44 * s,
              fontWeight: 900,
              color: "#1F1A14",
              letterSpacing: "-0.035em",
              lineHeight: 1.2,
            }}
          >
            {article.title}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 28,
              fontSize: 14 * s,
              color: "#7A6F62",
              fontWeight: 600,
            }}
          >
            <span>4월 18일 토요일 · 오전 7:00</span>
            <span>·</span>
            <span>3분 읽기</span>
            <span>·</span>
            <span>정리: 세줄아침 편집부</span>
          </div>

          <div style={{ height: 360, borderRadius: 20, overflow: "hidden", marginBottom: 28 }}>
            <Thumbnail cat={article.cat} size="xl" label="HERO IMAGE" />
          </div>

          <div
            style={{
              background: "#fff",
              border: "2px solid #FFD1A3",
              borderRadius: 18,
              padding: 20,
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <button
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                border: "none",
                background: "#E57C23",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 6px 16px rgba(229,124,35,0.3)",
              }}
            >
              <PlayIcon size={28} color="#fff" />
            </button>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12 * s,
                  color: "#B2570F",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                오디오로 듣기
              </div>
              <div
                style={{
                  fontSize: 17 * s,
                  fontWeight: 900,
                  color: "#1F1A14",
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}
              >
                전체 내용 · {article.duration}
              </div>
              <div
                style={{
                  height: 6,
                  background: "#F5EEE2",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: "30%", height: "100%", background: "#E57C23" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["느리게", "보통", "빠르게"].map((sp, i) => (
                <button
                  key={sp}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    background: i === 1 ? "#1F1A14" : "#fff",
                    color: i === 1 ? "#fff" : "#4A4037",
                    border: "1.5px solid " + (i === 1 ? "#1F1A14" : "#E8DCC7"),
                    fontSize: 13 * s,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(180deg, #FFF8EC 0%, #FFFBF5 100%)",
              border: "1px solid #F2D7B5",
              borderRadius: 20,
              padding: 28,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "grid", gap: 14 }}>
              {article.lines.map((line, i) => (
                <p
                  key={i}
                  style={{
                    margin: 0,
                    fontSize: 19 * s,
                    fontWeight: 700,
                    color: "#1F1A14",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.55,
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1.5px solid #F2E6D7",
              borderRadius: 18,
              padding: 24,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontSize: 16 * s,
                fontWeight: 900,
                color: "#1F1A14",
                letterSpacing: "-0.02em",
                marginBottom: 14,
              }}
            >
              🌱 오늘 할 수 있는 실천
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {article.tips.map((t, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: "#E8F5EC",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2E7D3F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 16 * s, color: "#2A241D", fontWeight: 600, lineHeight: 1.6 }}>
                    {t}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ fontSize: 17 * s, lineHeight: 1.85, color: "#2A241D", fontWeight: 500 }}>
            {article.body.map((p, i) => (
              <p key={i} style={{ marginBottom: 20 }}>
                {p}
              </p>
            ))}
          </div>

          <CoupangAdInline product={COUPANG_PRODUCTS[0]} />

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1px solid #F2E6D7",
            }}
          >
            <button
              style={{
                minHeight: 52,
                padding: "0 20px",
                borderRadius: 12,
                background: "#FFF2E3",
                color: "#B2570F",
                border: "none",
                fontSize: 15 * s,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <BookmarkIcon size={18} color="#B2570F" /> 서재에 저장
            </button>
            <button
              style={{
                minHeight: 52,
                padding: "0 20px",
                borderRadius: 12,
                background: "#fff",
                color: "#4A4037",
                border: "1.5px solid #E8DCC7",
                fontSize: 15 * s,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ShareIcon size={18} color="#4A4037" /> 공유하기
            </button>
            <Link
              href="/senior/home"
              style={{
                marginLeft: "auto",
                minHeight: 52,
                padding: "0 24px",
                borderRadius: 12,
                background: "#1F1A14",
                color: "#fff",
                fontSize: 15 * s,
                fontWeight: 900,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              다음 소식 <ChevronRightIcon size={16} color="#fff" />
            </Link>
          </div>
        </main>

        <aside>
          <div style={{ position: "sticky", top: 96, display: "grid", gap: 16 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 18,
                border: "1.5px solid #F2E6D7",
              }}
            >
              <div
                style={{
                  fontSize: 12 * s,
                  fontWeight: 800,
                  color: "#7A6F62",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                이 소식과 함께 보세요
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {related.map((r, i) => {
                  const mm = CATEGORY_META[r.c];
                  return (
                    <Link
                      key={i}
                      href="/senior/home"
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        paddingBottom: 12,
                        borderBottom: i < related.length - 1 ? "1px solid #F5EEE2" : "none",
                      }}
                    >
                      <Thumbnail cat={r.c} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 10 * s,
                            fontWeight: 800,
                            color: mm.color,
                            marginBottom: 4,
                          }}
                        >
                          {mm.emoji} {r.c}
                        </span>
                        <div
                          style={{
                            fontSize: 13 * s,
                            fontWeight: 800,
                            color: "#1F1A14",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.4,
                          }}
                        >
                          {r.t}
                        </div>
                        <div
                          style={{
                            fontSize: 11 * s,
                            color: "#9C907F",
                            fontWeight: 600,
                            marginTop: 4,
                          }}
                        >
                          🔊 {r.d}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
