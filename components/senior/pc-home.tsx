"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { useFontScale } from "./font-scale";
import { PCHeader } from "./pc-header";
import { CoupangAdInline, COUPANG_PRODUCTS, Thumbnail } from "./common";
import { ChevronRightIcon, PlayIcon, SpeakerIcon } from "./icons";
import { CATEGORY_META, type CategoryKey } from "./tokens";

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
  { slug: "warm-water", cat: "건강", sub: "혈압", title: "따뜻한 물 한 잔이 아침 혈압을 낮춘다는 연구", summary: "일어나자마자 미지근한 물 200ml를 천천히 마시면, 밤새 끈끈해진 혈액이 부드러워지고 혈압 상승이 줄어듭니다.", action: "오늘 아침부터 물 한 잔 먼저", time: "방금", duration: "1분 30초" },
  { slug: "health-insurance", cat: "돈", sub: "건강보험", title: "올해 건강보험료 기준이 바뀝니다. 꼭 확인하세요", summary: "재산 공제 기준이 올라가고, 피부양자 자격도 조정됩니다. 은퇴 가구의 평균 부담이 약간 줄어들 전망입니다.", action: "내 보험료 다시 계산해보기", time: "30분 전", duration: "2분" },
  { slug: "spring-allergy", cat: "실생활", sub: "계절", title: "봄철 알레르기, 집에서 간단히 막는 세 가지", summary: "창문 여는 시간은 오전보다 오후 늦게가 낫습니다. 외출 후 겉옷을 턴 뒤 들어오세요.", action: "오늘 외출 뒤 겉옷 털기", time: "1시간 전", duration: "1분 45초" },
  { slug: "transit-change", cat: "뉴스", sub: "생활", title: "다음 주부터 전국 버스·지하철 요금 제도 변경", summary: "수도권 환승 시간이 30분에서 1시간으로 늘어납니다. 어르신 무임은 그대로 유지됩니다.", action: "내 교통카드 확인하기", time: "2시간 전", duration: "2분 10초" },
  { slug: "grand-kids", cat: "관계", sub: "가족", title: "손주와 사이 좋은 할머니 할아버지의 공통점", summary: "말보다 먼저 들어주는 시간. 전화 통화보다 짧은 영상 메시지가 더 가깝게 느껴진다고 합니다.", action: null, time: "3시간 전", duration: "1분 50초" },
];

const TABS: (CategoryKey | "전체")[] = ["전체", "건강", "돈", "실생활", "뉴스", "관계"];

export function PCHome() {
  const { fontScale: s } = useFontScale();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("전체");
  const filtered = activeTab === "전체" ? ITEMS : ITEMS.filter((i) => i.cat === activeTab);
  const [featured, ...rest] = filtered;

  return (
    <div style={{ background: "#FFFBF5", minHeight: "100%" }}>
      <PCHeader activeTab="home" />

      <div
        style={{
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
          padding: "28px 36px 60px",
          display: "grid",
          gridTemplateColumns: "240px 1fr 300px",
          gap: 28,
        }}
      >
        {/* 좌측 카테고리 */}
        <aside>
          <div
            style={{
              position: "sticky",
              top: 96,
              background: "#fff",
              borderRadius: 16,
              border: "1.5px solid #F2E6D7",
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 12 * s,
                fontWeight: 800,
                color: "#7A6F62",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "4px 10px 10px",
              }}
            >
              카테고리
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              {TABS.map((t) => {
                const on = activeTab === t;
                const m = t !== "전체" ? CATEGORY_META[t] : null;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 12px",
                      borderRadius: 10,
                      background: on ? "#1F1A14" : "transparent",
                      color: on ? "#fff" : "#2A241D",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      fontSize: 15 * s,
                      fontWeight: on ? 900 : 700,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{m ? m.emoji : "📚"}</span>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* 중앙 피드 */}
        <main>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 13 * s,
                fontWeight: 800,
                color: "#E57C23",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              4월 18일 토요일 · 아침 7시 배달
            </div>
            <h1
              style={{
                margin: "8px 0 4px",
                fontSize: 32 * s,
                fontWeight: 900,
                color: "#1F1A14",
                letterSpacing: "-0.03em",
                lineHeight: 1.25,
              }}
            >
              좋은 아침이에요, 김영수 님 ☀️
            </h1>
            <p style={{ margin: 0, fontSize: 15 * s, color: "#4A4037", fontWeight: 500 }}>
              오늘의 세 줄 · {filtered.length}개 · 총 5분 20초
            </p>
          </div>

          {featured &&
            (() => {
              const m = CATEGORY_META[featured.cat];
              return (
                <article
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1.5px solid #F2E6D7",
                    marginBottom: 20,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ height: 280 }}>
                    <Thumbnail cat={featured.cat} size="xl" label="HERO IMG" />
                  </div>
                  <div style={{ padding: "26px 28px 28px" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        borderRadius: 999,
                        background: m.bg,
                        color: m.color,
                        fontSize: 13 * s,
                        fontWeight: 800,
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{m.emoji}</span>
                      {featured.cat} · {featured.sub}
                    </div>
                    <h2
                      style={{
                        margin: "0 0 10px",
                        fontSize: 24 * s,
                        fontWeight: 900,
                        color: "#1F1A14",
                        letterSpacing: "-0.03em",
                        lineHeight: 1.3,
                      }}
                    >
                      {featured.title}
                    </h2>
                    <p
                      style={{
                        margin: "0 0 14px",
                        fontSize: 15 * s,
                        lineHeight: 1.6,
                        color: "#4A4037",
                        fontWeight: 500,
                      }}
                    >
                      {featured.summary}
                    </p>
                    {featured.action && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "10px 16px",
                          borderRadius: 12,
                          background: "#FFF2E3",
                          fontSize: 14 * s,
                          fontWeight: 800,
                          color: "#B2570F",
                          letterSpacing: "-0.01em",
                          marginBottom: 18,
                        }}
                      >
                        ✓ {featured.action}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        style={{
                          minHeight: 48,
                          padding: "0 20px",
                          borderRadius: 12,
                          background: "#E57C23",
                          color: "#fff",
                          border: "none",
                          fontSize: 15 * s,
                          fontWeight: 900,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          boxShadow: "0 4px 10px rgba(229,124,35,0.3)",
                          fontFamily: "inherit",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <SpeakerIcon size={18} color="#fff" /> 듣기 · {featured.duration}
                      </button>
                      <Link
                        href={`/senior/detail/${featured.slug}`}
                        style={{
                          minHeight: 48,
                          padding: "0 20px",
                          borderRadius: 12,
                          background: "#fff",
                          color: "#1F1A14",
                          border: "1.5px solid #E8DCC7",
                          fontSize: 15 * s,
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        자세히 읽기 <ChevronRightIcon size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })()}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {rest.map((item, i) => {
              const m = CATEGORY_META[item.cat];
              return (
                <Fragment key={item.slug}>
                  {i === 2 && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <CoupangAdInline product={COUPANG_PRODUCTS[0]} />
                    </div>
                  )}
                  <Link
                    href={`/senior/detail/${item.slug}`}
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      padding: 16,
                      border: "1.5px solid #F2E6D7",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <Thumbnail cat={item.cat} size="lg" label="IMG" />
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 999,
                        alignSelf: "flex-start",
                        background: m.bg,
                        color: m.color,
                        fontSize: 12 * s,
                        fontWeight: 800,
                      }}
                    >
                      <span>{m.emoji}</span> {item.cat}
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18 * s,
                        fontWeight: 900,
                        color: "#1F1A14",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14 * s,
                        lineHeight: 1.55,
                        color: "#4A4037",
                        fontWeight: 500,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
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
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: "#FFF2E3",
                          fontSize: 13 * s,
                          fontWeight: 800,
                          color: "#B2570F",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        ✓ {item.action}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: "auto",
                        paddingTop: 8,
                        borderTop: "1px solid #F5EEE2",
                      }}
                    >
                      <span
                        style={{
                          padding: "8px 14px",
                          borderRadius: 10,
                          background: "#FFF2E3",
                          color: "#B2570F",
                          fontSize: 13 * s,
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <SpeakerIcon size={14} /> {item.duration}
                      </span>
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
                  </Link>
                </Fragment>
              );
            })}
          </div>
        </main>

        {/* 우측 위젯 */}
        <aside>
          <div style={{ position: "sticky", top: 96, display: "grid", gap: 16 }}>
            <div
              style={{
                background: "linear-gradient(135deg, #E57C23 0%, #D16612 100%)",
                borderRadius: 18,
                padding: 18,
                color: "#fff",
                boxShadow: "0 8px 22px rgba(229,124,35,0.25)",
              }}
            >
              <div
                style={{
                  fontSize: 11 * s,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  opacity: 0.9,
                  marginBottom: 8,
                }}
              >
                오늘 · 5분 20초
              </div>
              <div
                style={{
                  fontSize: 18 * s,
                  fontWeight: 900,
                  lineHeight: 1.35,
                  marginBottom: 16,
                  letterSpacing: "-0.02em",
                }}
              >
                바쁘시면,<br />귀로만 들어보세요
              </div>
              <button
                style={{
                  width: "100%",
                  minHeight: 50,
                  borderRadius: 12,
                  border: "none",
                  background: "#fff",
                  color: "#B2570F",
                  fontSize: 15 * s,
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "inherit",
                }}
              >
                <PlayIcon size={18} color="#B2570F" /> 전체 듣기
              </button>
            </div>

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
                  marginBottom: 10,
                }}
              >
                내 구독 설정
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13 * s, color: "#7A6F62", fontWeight: 600, marginBottom: 2 }}>
                    배송 시간
                  </div>
                  <div
                    style={{
                      fontSize: 17 * s,
                      fontWeight: 900,
                      color: "#1F1A14",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    매일 아침 7:00
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13 * s, color: "#7A6F62", fontWeight: 600, marginBottom: 4 }}>
                    받는 분야
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(["건강", "돈", "실생활"] as CategoryKey[]).map((k) => {
                      const m = CATEGORY_META[k];
                      return (
                        <span
                          key={k}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: m.bg,
                            color: m.color,
                            fontSize: 12 * s,
                            fontWeight: 800,
                          }}
                        >
                          {m.emoji} {k}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <button
                  style={{
                    minHeight: 40,
                    borderRadius: 10,
                    border: "1.5px solid #E8DCC7",
                    background: "#fff",
                    color: "#4A4037",
                    fontSize: 13 * s,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  설정 바꾸기
                </button>
              </div>
            </div>

            <div
              style={{
                background: "#FFF9EF",
                borderRadius: 14,
                padding: 14,
                border: "1px solid #F2E6D7",
                fontSize: 13 * s,
                color: "#4A4037",
                lineHeight: 1.6,
              }}
            >
              💡 글씨가 작게 느껴지시면 상단의 <b>가가가</b> 버튼으로 크기를 바꿔보세요.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
