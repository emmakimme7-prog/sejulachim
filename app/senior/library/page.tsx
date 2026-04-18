"use client";

import { useState } from "react";
import {
  BottomTabBar,
  FloatingFontToggle,
  SeniorTopBar,
  Thumbnail,
} from "@/components/senior/common";
import { useFontScale } from "@/components/senior/font-scale";
import { BookmarkIcon } from "@/components/senior/icons";
import { CATEGORY_META, type CategoryKey } from "@/components/senior/tokens";

type Item = {
  cat: CategoryKey;
  date: string;
  title: string;
  summary: string;
  action: string;
};

const SAVED: Item[] = [
  {
    cat: "건강",
    date: "어제",
    title: "따뜻한 물 한 잔이 아침 혈압을 낮춘다는 연구",
    summary: "일어나자마자 미지근한 물 200ml를 천천히. 혈압 상승이 줄어듭니다.",
    action: "오늘 아침부터 물 한 잔 먼저",
  },
  {
    cat: "돈",
    date: "3일 전",
    title: "올해 건강보험료 기준이 바뀝니다",
    summary: "재산 공제 기준이 올라가고, 피부양자 자격도 조정됩니다.",
    action: "내 보험료 다시 계산해보기",
  },
  {
    cat: "관계",
    date: "지난주",
    title: "오래 건강한 부부의 가장 큰 공통점",
    summary: "먼저 들어주는 시간. 하루 10분이면 충분하다고 합니다.",
    action: "오늘 10분 먼저 들어주기",
  },
];

export default function SeniorLibrary() {
  const { fontScale: s } = useFontScale();
  const [tab, setTab] = useState("저장");

  return (
    <div style={{ background: "#FFFBF5", minHeight: "100%" }}>
      <SeniorTopBar />

      <div style={{ padding: "20px 20px 8px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 26 * s,
            fontWeight: 900,
            color: "#1F1A14",
            letterSpacing: "-0.03em",
          }}
        >
          내 서재
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14 * s, color: "#7A6F62", fontWeight: 500 }}>
          저장한 소식과 들었던 소식을 다시 볼 수 있어요
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "14px 20px 8px" }}>
        {["저장", "들은 소식", "액션 완료"].map((t) => {
          const on = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 12,
                background: on ? "#1F1A14" : "#fff",
                color: on ? "#fff" : "#4A4037",
                border: on ? "none" : "1.5px solid #E8DCC7",
                fontSize: 14 * s,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "10px 20px 30px", display: "grid", gap: 12 }}>
        {SAVED.map((it, i) => {
          const m = CATEGORY_META[it.cat];
          return (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1.5px solid #F2E6D7",
                padding: 14,
                display: "flex",
                gap: 12,
              }}
            >
              <Thumbnail cat={it.cat} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: m.bg,
                      color: m.color,
                      fontSize: 12 * s,
                      fontWeight: 800,
                    }}
                  >
                    {m.emoji} {it.cat}
                  </span>
                  <span style={{ fontSize: 12 * s, color: "#9C907F", fontWeight: 600 }}>
                    {it.date}
                  </span>
                  <button
                    style={{
                      marginLeft: "auto",
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="저장 해제"
                  >
                    <BookmarkIcon size={18} color="#E57C23" filled />
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 16 * s,
                    fontWeight: 800,
                    color: "#1F1A14",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.4,
                    marginBottom: 8,
                  }}
                >
                  {it.title}
                </div>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 13 * s,
                    lineHeight: 1.5,
                    color: "#4A4037",
                    fontWeight: 500,
                  }}
                >
                  {it.summary}
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: "#FFF2E3",
                    fontSize: 12 * s,
                    color: "#B2570F",
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                  }}
                >
                  ✓ {it.action}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 100 }} />
      <BottomTabBar active="library" />
      <FloatingFontToggle />
    </div>
  );
}
