"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import {
  BottomTabBar,
  CoupangAdInline,
  COUPANG_PRODUCTS,
  DateStrip,
  FloatingFontToggle,
  SeniorTopBar,
  Thumbnail,
} from "@/components/senior/common";
import { useFontScale } from "@/components/senior/font-scale";
import { ChevronRightIcon, PlayIcon, SpeakerIcon } from "@/components/senior/icons";
import { PCHome } from "@/components/senior/pc-home";
import { CATEGORY_META, type CategoryKey } from "@/components/senior/tokens";
import { useIsDesktop } from "@/components/senior/use-media-query";

type Item = {
  slug: string;
  cat: CategoryKey;
  sub: string;
  title: string;
  summary: string;
  action: string | null;
  time: string;
  duration: string;
};

const ITEMS: Item[] = [
  {
    slug: "warm-water",
    cat: "건강",
    sub: "혈압",
    title: "따뜻한 물 한 잔이 아침 혈압을 낮춘다는 연구",
    summary:
      "일어나자마자 미지근한 물 200ml를 천천히 마시면, 밤새 끈끈해진 혈액이 부드러워지고 혈압 상승이 줄어듭니다.",
    action: "오늘 아침부터 물 한 잔 먼저",
    time: "2분 전",
    duration: "1분 30초",
  },
  {
    slug: "health-insurance",
    cat: "돈",
    sub: "건강보험",
    title: "올해 건강보험료 기준이 바뀝니다. 꼭 확인하세요",
    summary:
      "재산 공제 기준이 올라가고, 피부양자 자격도 조정됩니다. 은퇴 가구의 평균 부담이 약간 줄어들 전망입니다.",
    action: "내 보험료 다시 계산해보기",
    time: "30분 전",
    duration: "2분",
  },
  {
    slug: "spring-allergy",
    cat: "실생활",
    sub: "계절",
    title: "봄철 알레르기, 집에서 간단히 막는 세 가지",
    summary:
      "창문 여는 시간은 오전보다 오후 늦게가 낫습니다. 외출 후 겉옷을 턴 뒤 들어오고, 샤워 전 세수부터 하세요.",
    action: null,
    time: "1시간 전",
    duration: "1분 45초",
  },
  {
    slug: "transit-change",
    cat: "뉴스",
    sub: "생활",
    title: "다음 주부터 전국 버스·지하철 요금 제도 변경",
    summary: "수도권 환승 시간이 30분에서 1시간으로 늘어납니다. 어르신 무임은 그대로 유지됩니다.",
    action: "내 교통카드 확인하기",
    time: "2시간 전",
    duration: "2분 10초",
  },
];

const TABS: (CategoryKey | "전체")[] = ["전체", "건강", "돈", "실생활", "뉴스", "관계"];

export default function SeniorHome() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <PCHome />;
  return <MobileHome />;
}

function MobileHome() {
  const { fontScale: s } = useFontScale();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("전체");
  const filtered = activeTab === "전체" ? ITEMS : ITEMS.filter((i) => i.cat === activeTab);

  return (
    <div style={{ background: "#FFFBF5", minHeight: "100%" }}>
      <SeniorTopBar />
      <DateStrip greeting="☀️ 좋은 아침이에요, 김영수 님" />

      <div style={{ padding: "6px 20px 14px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 26 * s,
            fontWeight: 900,
            color: "#1F1A14",
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
          }}
        >
          오늘의 세 줄 브리핑
        </h1>
      </div>

      <div style={{ padding: "0 20px 18px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #E57C23 0%, #D16612 100%)",
            borderRadius: 20,
            padding: 20,
            color: "#fff",
            boxShadow: "0 8px 22px rgba(229, 124, 35, 0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 12 * s,
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                opacity: 0.9,
              }}
            >
              오늘 3개 · 총 5분 20초
            </div>
          </div>
          <div
            style={{
              fontSize: 18 * s,
              fontWeight: 800,
              lineHeight: 1.45,
              marginBottom: 18,
              letterSpacing: "-0.02em",
            }}
          >
            바쁘시면, 오늘 세 줄을
            <br />
            <b style={{ background: "rgba(255,255,255,0.2)", padding: "1px 8px", borderRadius: 8 }}>
              귀로만
            </b>{" "}
            들어보세요
          </div>
          <button
            style={{
              width: "100%",
              minHeight: 56,
              background: "#fff",
              color: "#B2570F",
              border: "none",
              borderRadius: 14,
              fontSize: 18 * s,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            <PlayIcon size={20 * s} color="#B2570F" />
            전체 듣기
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "4px 20px 16px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {TABS.map((t) => {
          const active = activeTab === t;
          const meta = t !== "전체" ? CATEGORY_META[t] : null;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                flexShrink: 0,
                minHeight: 44,
                padding: "0 18px",
                borderRadius: 999,
                background: active ? "#1F1A14" : "#fff",
                color: active ? "#fff" : "#4A4037",
                border: active ? "none" : "1.5px solid #E8DCC7",
                fontSize: 15 * s,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
            >
              {meta && <span>{meta.emoji}</span>}
              {t}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "0 20px 24px", display: "grid", gap: 14 }}>
        {filtered.map((item, i) => {
          const meta = CATEGORY_META[item.cat];
          return (
            <Fragment key={item.slug}>
              {i === 2 && <CoupangAdInline product={COUPANG_PRODUCTS[1]} />}
              <article
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  border: "1.5px solid #F2E6D7",
                  padding: 18,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
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
                    }}
                  >
                    <span style={{ fontSize: 16 * s }}>{meta.emoji}</span>
                    {item.cat} · {item.sub}
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 12 * s,
                      color: "#9C907F",
                      fontWeight: 600,
                    }}
                  >
                    {item.time}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <h3
                    style={{
                      flex: 1,
                      margin: 0,
                      fontSize: 20 * s,
                      fontWeight: 900,
                      color: "#1F1A14",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.35,
                    }}
                  >
                    {item.title}
                  </h3>
                  <Thumbnail cat={item.cat} size="md" label="IMG" />
                </div>

                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: 15 * s,
                    lineHeight: 1.6,
                    color: "#4A4037",
                    fontWeight: 500,
                  }}
                >
                  {item.summary}
                </p>

                {item.action && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "#FFF2E3",
                      marginBottom: 14,
                      fontSize: 14 * s,
                      fontWeight: 800,
                      color: "#B2570F",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    ✓ {item.action}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      flex: 1,
                      minHeight: 48,
                      background: "#FFF2E3",
                      color: "#B2570F",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 15 * s,
                      fontWeight: 900,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    <SpeakerIcon size={18 * s} /> 듣기 {item.duration}
                  </button>
                  <Link
                    href={`/senior/detail/${item.slug}`}
                    style={{
                      minHeight: 48,
                      padding: "0 16px",
                      background: "#fff",
                      color: "#4A4037",
                      border: "1.5px solid #E8DCC7",
                      borderRadius: 12,
                      fontSize: 15 * s,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      textDecoration: "none",
                    }}
                  >
                    자세히 <ChevronRightIcon size={16 * s} />
                  </Link>
                </div>
              </article>
            </Fragment>
          );
        })}
      </div>

      <div style={{ height: 100 }} />
      <BottomTabBar active="home" />
      <FloatingFontToggle />
    </div>
  );
}
