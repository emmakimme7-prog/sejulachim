"use client";

import Link from "next/link";
import { FONT_OPTIONS } from "./tokens";
import { useFontScale } from "./font-scale";
import { BellIcon, BookmarkIcon, SearchIcon } from "./icons";
import { IconButton } from "./common";

export function FontSizeQuickToggle({ compact = false }: { compact?: boolean }) {
  const { currentSize, setSize } = useFontScale();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#F5EEE2",
        borderRadius: 999,
        padding: 4,
        gap: 2,
      }}
    >
      {FONT_OPTIONS.map((opt) => {
        const active = currentSize === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => setSize(opt.key)}
            style={{
              minWidth: compact ? 36 : 44,
              height: 36,
              padding: "0 10px",
              border: "none",
              borderRadius: 999,
              background: active ? "#1F1A14" : "transparent",
              color: active ? "#fff" : "#4A4037",
              fontWeight: active ? 900 : 700,
              fontSize: opt.size,
              letterSpacing: "-0.02em",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
          >
            {opt.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

export function PCHeader({
  loggedIn = true,
  activeTab = "home",
}: {
  loggedIn?: boolean;
  activeTab?: "home" | "popular" | "archive";
}) {
  const { fontScale: s } = useFontScale();
  const navTabs: { k: "home" | "popular" | "archive"; l: string }[] = [
    { k: "home", l: "오늘의 소식" },
    { k: "popular", l: "인기 소식" },
    { k: "archive", l: "지난 소식" },
  ];
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "#fff",
        borderBottom: "1px solid #F2E6D7",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 36px",
          height: 72,
          display: "flex",
          alignItems: "center",
          gap: 36,
        }}
      >
        <Link
          href="/senior"
          style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, textDecoration: "none" }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#E57C23",
              color: "#fff",
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            세
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
            세줄아침
          </div>
        </Link>

        <nav style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {navTabs.map((t) => {
            const on = activeTab === t.k;
            return (
              <Link
                key={t.k}
                href={t.k === "home" ? "/senior/home" : "/senior/home"}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: on ? "#FFF2E3" : "transparent",
                  color: on ? "#B2570F" : "#4A4037",
                  fontSize: 16 * s,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {t.l}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginLeft: "auto", position: "relative", flex: "0 1 340px" }}>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <SearchIcon size={18} color="#9C907F" />
          </div>
          <input
            placeholder="지난 소식 검색"
            style={{
              width: "100%",
              height: 44,
              paddingLeft: 42,
              paddingRight: 16,
              borderRadius: 999,
              border: "1.5px solid #E8DCC7",
              background: "#FFFBF5",
              fontSize: 14 * s,
              color: "#1F1A14",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <FontSizeQuickToggle />
          {loggedIn ? (
            <>
              <div style={{ width: 1, height: 28, background: "#E8DCC7", margin: "0 6px" }} />
              <IconButton ariaLabel="알림">
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <BellIcon size={22} color="#4A4037" />
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#E57C23",
                      border: "1.5px solid #fff",
                    }}
                  />
                </span>
              </IconButton>
              <Link href="/senior/library" aria-label="서재" style={{ display: "inline-flex" }}>
                <IconButton ariaLabel="서재">
                  <BookmarkIcon size={22} color="#4A4037" />
                </IconButton>
              </Link>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: "#FFF2E3",
                  color: "#B2570F",
                  fontWeight: 900,
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 4,
                  letterSpacing: "-0.01em",
                }}
              >
                김
              </div>
            </>
          ) : (
            <>
              <Link
                href="/senior/signup"
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: "transparent",
                  color: "#4A4037",
                  fontSize: 15 * s,
                  fontWeight: 800,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                로그인
              </Link>
              <Link
                href="/senior/signup"
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: "#E57C23",
                  color: "#fff",
                  fontSize: 15 * s,
                  fontWeight: 900,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 10px rgba(229,124,35,0.25)",
                }}
              >
                무료 구독 시작
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
