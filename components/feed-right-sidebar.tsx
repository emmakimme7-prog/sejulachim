"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { Play } from "lucide-react";

import { playListenable, setAutoPlayNextFn, setSpeechPlaylist } from "@/components/speech-controls";

type Item = {
  title: string;
  short_summary: string;
  action_line?: string | null;
  slug?: string;
  audio_url?: string | null;
};

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  건강: { emoji: "💪", color: "#2E7D3F", bg: "#E8F5EC" },
  돈: { emoji: "💰", color: "#B26A00", bg: "#FFF4E0" },
  실생활: { emoji: "🏠", color: "#1565C0", bg: "#E3F1FD" },
  뉴스: { emoji: "📰", color: "#424242", bg: "#EFEFEF" },
  관계: { emoji: "💛", color: "#C2185B", bg: "#FDE8EF" },
};

export function FeedRightSidebar({
  items,
  interests,
}: {
  items: Item[];
  interests?: string[];
}) {
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const playFromIdx = useCallback((idx: number) => {
    const list = itemsRef.current;
    const item = list[idx];
    if (!item) return;
    const nextItem = list[idx + 1];
    const text = [item.title, item.short_summary, item.action_line].filter(Boolean).join(". ");
    setSpeechPlaylist(
      list.slice(idx).map((it) => ({ label: it.title })),
      0
    );
    setAutoPlayNextFn(nextItem ? () => playFromIdx(idx + 1) : null);
    playListenable({
      text,
      title: item.title,
      audioUrl: item.audio_url ?? null,
      slug: item.slug ?? null,
    });
  }, []);

  const handlePlayAll = useCallback(() => {
    if (items.length === 0) return;
    playFromIdx(0);
  }, [items.length, playFromIdx]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* 오늘 전체 듣기 CTA */}
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
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            opacity: 0.9,
            marginBottom: 8,
          }}
        >
          오늘 · {items.length}개 소식
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1.35,
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          바쁘시면,<br />
          귀로만 들어보세요
        </div>
        <button
          type="button"
          onClick={handlePlayAll}
          disabled={items.length === 0}
          style={{
            width: "100%",
            minHeight: 50,
            borderRadius: 12,
            border: "none",
            background: "#fff",
            color: "#B2570F",
            fontSize: 15,
            fontWeight: 900,
            cursor: items.length === 0 ? "not-allowed" : "pointer",
            opacity: items.length === 0 ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
          }}
        >
          <Play style={{ width: 18, height: 18, fill: "#B2570F" }} />
          전체 듣기
        </button>
      </div>

      {/* 내 구독 설정 */}
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
            fontSize: 12,
            fontWeight: 800,
            color: "#7A6F62",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          내 구독 설정
        </div>

        {interests && interests.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#7A6F62", fontWeight: 600, marginBottom: 6 }}>받는 분야</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {interests.map((cat) => {
                const m = CATEGORY_META[cat] ?? { emoji: "📄", color: "#7A6F62", bg: "#F5EEE2" };
                return (
                  <span
                    key={cat}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: m.bg,
                      color: m.color,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {m.emoji} {cat}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#4A4037", fontWeight: 500, marginBottom: 10 }}>
            로그인하면 내 관심 분야가 표시됩니다.
          </div>
        )}

        <Link
          href="/account"
          style={{
            display: "inline-flex",
            alignItems: "center",
            color: "#B2570F",
            fontSize: 13,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          설정 바꾸기 →
        </Link>
      </div>

      {/* 글씨 크기 팁 */}
      <div
        style={{
          background: "#FFF9EF",
          borderRadius: 14,
          padding: 14,
          border: "1px solid #F2E6D7",
          fontSize: 13,
          color: "#4A4037",
          lineHeight: 1.6,
          fontWeight: 500,
        }}
      >
        💡 글씨가 작게 느껴지시면 상단의 <b style={{ color: "#1F1A14" }}>가 가 가</b> 버튼으로 크기를 바꿔보세요.
      </div>
    </div>
  );
}
