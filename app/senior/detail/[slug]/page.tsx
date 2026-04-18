"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BottomTabBar,
  CoupangAdInline,
  COUPANG_PRODUCTS,
  FloatingFontToggle,
  IconButton,
  Thumbnail,
} from "@/components/senior/common";
import { useFontScale } from "@/components/senior/font-scale";
import { BackIcon, BookmarkIcon, ChevronRightIcon, PlayIcon, ShareIcon } from "@/components/senior/icons";
import { PCDetail } from "@/components/senior/pc-detail";
import { CATEGORY_META, type CategoryKey } from "@/components/senior/tokens";
import { useIsDesktop } from "@/components/senior/use-media-query";

export default function SeniorDetail() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <PCDetail />;
  return <MobileDetail />;
}

function MobileDetail() {
  const { fontScale: s } = useFontScale();
  const router = useRouter();
  const meta = CATEGORY_META["건강"];

  return (
    <div style={{ background: "#FFFBF5", minHeight: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 10px",
          background: "#fff",
          borderBottom: "1px solid #F2E6D7",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            minHeight: 44,
            padding: "0 12px",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: "none",
            color: "#1F1A14",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <BackIcon size={24} color="#1F1A14" /> 뒤로
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          <IconButton ariaLabel="저장">
            <BookmarkIcon size={22} color="#4A4037" />
          </IconButton>
          <IconButton ariaLabel="공유">
            <ShareIcon size={22} color="#4A4037" />
          </IconButton>
        </div>
      </div>

      <article style={{ padding: "20px 22px 40px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 999,
            background: meta.bg,
            color: meta.color,
            fontSize: 13 * s,
            fontWeight: 800,
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 16 * s }}>{meta.emoji}</span>
          건강 · 혈압
        </div>

        <h1
          style={{
            margin: "0 0 12px",
            fontSize: 28 * s,
            fontWeight: 900,
            color: "#1F1A14",
            letterSpacing: "-0.03em",
            lineHeight: 1.3,
          }}
        >
          따뜻한 물 한 잔이<br />
          아침 혈압을 낮춘다는 연구
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13 * s,
            color: "#7A6F62",
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          <span>4월 18일 아침 · 서울대 보건대</span>
          <span>·</span>
          <span>읽는데 1분 30초</span>
        </div>

        <div style={{ marginBottom: 22 }}>
          <Thumbnail cat="건강" size="lg" label="HERO IMAGE · 따뜻한 물 한 잔" />
        </div>

        <div
          style={{
            background: "#fff",
            border: "2px solid #FFD1A3",
            borderRadius: 18,
            padding: 16,
            marginBottom: 22,
            boxShadow: "0 2px 8px rgba(229, 124, 35, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: "#E57C23",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                boxShadow: "0 4px 10px rgba(229, 124, 35, 0.35)",
              }}
            >
              <PlayIcon size={24} color="#fff" />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15 * s, fontWeight: 900, color: "#1F1A14", marginBottom: 4 }}>
                소리로 듣기
              </div>
              <div
                style={{
                  height: 6,
                  background: "#F5EEE2",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: "0%", height: "100%", background: "#E57C23" }} />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12 * s,
                  color: "#7A6F62",
                  fontWeight: 700,
                  marginTop: 6,
                }}
              >
                <span>0:00</span>
                <span>1:30</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {["느리게", "보통", "빠르게"].map((sp, i) => (
              <button
                key={sp}
                style={{
                  flex: 1,
                  minHeight: 40,
                  borderRadius: 10,
                  background: i === 1 ? "#FFF2E3" : "#F5EEE2",
                  border: i === 1 ? "1.5px solid #FFD1A3" : "1.5px solid transparent",
                  color: i === 1 ? "#B2570F" : "#4A4037",
                  fontSize: 14 * s,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            padding: 18,
            border: "1.5px solid #F2E6D7",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {[
              "일어나자마자 마시는 따뜻한 물 200ml는 밤새 끈끈해진 혈액을 부드럽게 풀어줍니다.",
              "서울대 연구팀이 어르신 300명을 분석한 결과, 아침 수축기 혈압이 평균 6mmHg 낮아졌습니다.",
              "너무 뜨겁지 않은, 미지근한 물을 천천히 마시는 것이 가장 효과적입니다.",
            ].map((line, i) => (
              <p
                key={i}
                style={{
                  margin: 0,
                  fontSize: 16 * s,
                  lineHeight: 1.6,
                  color: "#1F1A14",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
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
            borderRadius: 16,
            padding: 18,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 15 * s,
              fontWeight: 900,
              color: "#1F1A14",
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            🌱 오늘 할 수 있는 실천
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {[
              "기상 직후, 양치 전에 한 잔",
              "너무 뜨겁지 않은 미지근한 온도",
              "한 번에 들이키지 말고 천천히",
            ].map((t, i) => (
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
                <span style={{ fontSize: 15 * s, color: "#2A241D", fontWeight: 600, lineHeight: 1.6 }}>
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            fontSize: 17 * s,
            lineHeight: 1.8,
            color: "#2A241D",
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          <p style={{ margin: "0 0 18px" }}>
            아침에 일어나면 몸 안의 수분이 부족해 피가 끈끈해져 있습니다. 이 상태에서 갑자기
            움직이거나 찬물을 마시면 혈관에 부담이 생길 수 있습니다.
          </p>
          <p style={{ margin: "0 0 18px" }}>
            <b style={{ background: "#FFF2E3", padding: "0 6px", borderRadius: 4, color: "#B2570F" }}>
              서울대 보건대
            </b>
            가 60세 이상 어르신 300명을 6개월간 관찰한 결과, 매일 아침{" "}
            <b>미지근한 물 한 잔(200ml)</b>을 천천히 마신 분들은 그렇지 않은 분들에 비해 수축기
            혈압이 평균 6mmHg 낮아졌습니다.
          </p>
        </div>

        <div style={{ marginTop: 24 }}>
          <CoupangAdInline product={COUPANG_PRODUCTS[0]} />
        </div>

        <div style={{ marginTop: 30 }}>
          <h3
            style={{
              margin: "0 0 14px",
              fontSize: 18 * s,
              fontWeight: 900,
              color: "#1F1A14",
              letterSpacing: "-0.02em",
            }}
          >
            이 소식과 함께 보세요
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            {(
              [
                { t: "고혈압 약, 아침에 먹는 게 좋을까 저녁에 먹는 게 좋을까", c: "건강" },
                { t: "은퇴 후 의료비 줄이는 가장 간단한 습관 3가지", c: "돈" },
              ] as { t: string; c: CategoryKey }[]
            ).map((r, i) => {
              const m = CATEGORY_META[r.c];
              return (
                <Link
                  key={i}
                  href="/senior/home"
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 14,
                    border: "1.5px solid #F2E6D7",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <Thumbnail cat={r.c} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: m.bg,
                        color: m.color,
                        fontSize: 11 * s,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      {m.emoji} {r.c}
                    </div>
                    <div
                      style={{
                        fontSize: 14 * s,
                        fontWeight: 700,
                        color: "#1F1A14",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.4,
                      }}
                    >
                      {r.t}
                    </div>
                  </div>
                  <ChevronRightIcon size={18} color="#9C907F" />
                </Link>
              );
            })}
          </div>
        </div>
      </article>

      <div style={{ height: 100 }} />
      <BottomTabBar active="home" />
      <FloatingFontToggle />
    </div>
  );
}
