"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORY_META, FONT_OPTIONS, type CategoryKey, type SizeKey } from "./tokens";
import { useFontScale } from "./font-scale";
import {
  BellIcon,
  BookmarkIcon,
  HomeIcon,
  SearchIcon,
  TypeIcon,
  UserIcon,
} from "./icons";

export function IconButton({
  children,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        background: "#fff",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function SeniorTopBar({ logoOnly = false }: { logoOnly?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: "#fff",
        borderBottom: "1px solid #F2E6D7",
        position: "sticky",
        top: 0,
        zIndex: 40,
        minHeight: 60,
      }}
    >
      <Link
        href="/senior"
        style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "#E57C23",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: "-0.02em",
          }}
        >
          세
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          세줄아침
        </div>
      </Link>

      {logoOnly ? (
        <Link
          href="/senior/signup"
          style={{
            minHeight: 40,
            padding: "0 16px",
            borderRadius: 999,
            background: "#1F1A14",
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          로그인
        </Link>
      ) : (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <IconButton ariaLabel="검색">
            <SearchIcon size={22} color="#4A4037" />
          </IconButton>
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
        </div>
      )}
    </div>
  );
}

export function DateStrip({ greeting }: { greeting?: string | null }) {
  const { fontScale: s } = useFontScale();
  return (
    <div
      style={{
        padding: "14px 20px 6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12 * s,
            fontWeight: 700,
            color: "#E57C23",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          4.18 토요일 · 아침 7시
        </div>
        {greeting && (
          <div
            style={{
              marginTop: 6,
              fontSize: 14 * s,
              fontWeight: 700,
              color: "#4A4037",
              letterSpacing: "-0.01em",
            }}
          >
            {greeting}
          </div>
        )}
      </div>
    </div>
  );
}

export function FloatingFontToggle() {
  const { currentSize, setSize } = useFontScale();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "fixed", right: 16, bottom: 96, zIndex: 60 }}>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 68,
            right: 0,
            background: "#fff",
            borderRadius: 18,
            border: "2px solid #F2E6D7",
            padding: 10,
            width: 220,
            boxShadow: "0 10px 28px rgba(0,0,0,0.14)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: "#7A6F62", padding: "6px 8px 10px" }}>
            글씨 크기
          </div>
          {FONT_OPTIONS.map((opt) => {
            const active = currentSize === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  setSize(opt.key);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  marginBottom: 4,
                  borderRadius: 12,
                  background: active ? "#FFF2E3" : "transparent",
                  border: active ? "2px solid #E57C23" : "2px solid transparent",
                  color: "#1F1A14",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: opt.size + 6 }}>가</span>
                <span style={{ fontSize: 15 }}>{opt.label}</span>
                {active && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
      <button
        aria-label="글씨 크기"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 60,
          height: 60,
          borderRadius: 999,
          background: "#1F1A14",
          color: "#fff",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          cursor: "pointer",
          boxShadow: "0 8px 22px rgba(0,0,0,0.22)",
        }}
      >
        <TypeIcon size={22} color="#fff" />
        <span style={{ fontSize: 10, fontWeight: 800 }}>글씨</span>
      </button>
    </div>
  );
}

export function BottomTabBar({ active = "home" }: { active?: "home" | "today" | "library" | "me" }) {
  const router = useRouter();
  const tabs: {
    key: "home" | "today" | "library" | "me";
    label: string;
    icon: typeof HomeIcon;
    href: string;
  }[] = [
    { key: "home", label: "홈", icon: HomeIcon, href: "/senior/home" },
    { key: "today", label: "오늘", icon: SearchIcon, href: "/senior/home" },
    { key: "library", label: "내서재", icon: BookmarkIcon, href: "/senior/library" },
    { key: "me", label: "내정보", icon: UserIcon, href: "/senior/home" },
  ];
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid #F2E6D7",
        display: "flex",
        padding: "6px 6px 24px",
        zIndex: 40,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => router.push(t.href)}
            style={{
              flex: 1,
              minHeight: 56,
              background: "transparent",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              padding: "6px 0",
              fontFamily: "inherit",
            }}
          >
            <Icon size={26} color={isActive ? "#E57C23" : "#7A6F62"} filled={isActive} />
            <span
              style={{
                fontSize: 12,
                fontWeight: isActive ? 900 : 700,
                color: isActive ? "#E57C23" : "#7A6F62",
                letterSpacing: "-0.01em",
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Thumbnail({
  cat,
  size = "md",
  label,
}: {
  cat: CategoryKey;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
}) {
  const meta = CATEGORY_META[cat] ?? { bg: "#F5EEE2", color: "#7A6F62", emoji: "📄" };
  const dims = {
    sm: { w: 56, h: 56, r: 10, fs: 22 },
    md: { w: 84, h: 84, r: 14, fs: 30 },
    lg: { w: "100%", h: 180, r: 16, fs: 48 },
    xl: { w: "100%", h: "100%", r: 0, fs: 72 },
  }[size];

  const stripe = `repeating-linear-gradient(135deg, ${meta.color}14 0 8px, transparent 8px 16px)`;

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: dims.r,
        background: meta.bg,
        backgroundImage: stripe,
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${meta.color}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: dims.fs, opacity: 0.8 }}>{meta.emoji}</div>
      {label && (
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: 6,
            right: 6,
            fontSize: 10,
            color: meta.color,
            opacity: 0.6,
            fontFamily: "ui-monospace, monospace",
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ── 쿠팡 광고 ───────────────────────────────────────────────
export type CoupangProduct = {
  name: string;
  brand: string;
  price: number;
  origPrice: number;
  rating: number;
  reviews: string;
  rocket: boolean;
  img: { bg: string; emoji: string };
};

export const COUPANG_PRODUCTS: CoupangProduct[] = [
  { name: "혈압계 자동 팔뚝형 (큰 숫자 화면)", brand: "오므론", price: 59900, origPrice: 89000, rating: 4.8, reviews: "2.4만", rocket: true, img: { bg: "#E8F5EC", emoji: "🩺" } },
  { name: "온열 찜질기 목어깨 전신용 무선", brand: "세라젬", price: 39800, origPrice: 58000, rating: 4.7, reviews: "1.1만", rocket: true, img: { bg: "#FFF4E0", emoji: "♨️" } },
  { name: "저염식 국물팩 20개입 (나트륨 35% 저감)", brand: "CJ", price: 12900, origPrice: 17900, rating: 4.6, reviews: "8.7천", rocket: true, img: { bg: "#E3F1FD", emoji: "🍲" } },
  { name: "미끄럼방지 욕실매트 대형 (항균)", brand: "쾌청", price: 15900, origPrice: 24000, rating: 4.9, reviews: "3.2만", rocket: true, img: { bg: "#FDE8EF", emoji: "🛁" } },
];

export function AdLabel({ size = "sm" }: { size?: "sm" | "lg" }) {
  const pad = size === "lg" ? "5px 10px" : "3px 8px";
  const fs = size === "lg" ? 12 : 11;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: pad,
        borderRadius: 4,
        background: "#FFF2E3",
        color: "#B2570F",
        fontSize: fs,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        border: "1px solid #F2D7B5",
      }}
    >
      AD · 광고
    </span>
  );
}

function RocketBadge({ size = 14 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        color: "#00C2D4",
        fontSize: size,
        fontWeight: 900,
        letterSpacing: "-0.02em",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: 3,
          background: "#00C2D4",
          color: "#fff",
          fontSize: size * 0.7,
          fontWeight: 900,
        }}
      >
        🚀
      </span>
      로켓배송
    </span>
  );
}

function ProductThumb({ product, size = 88 }: { product: CoupangProduct; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: product.img.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        flexShrink: 0,
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      {product.img.emoji}
    </div>
  );
}

export function CoupangAdSidebar({
  products = COUPANG_PRODUCTS.slice(0, 2),
}: {
  products?: CoupangProduct[];
}) {
  const { fontScale: s } = useFontScale();
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        border: "1.5px dashed #F2D7B5",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 * s, fontWeight: 900, color: "#2F86F6", letterSpacing: "-0.02em" }}>
            Coupang
          </span>
          <span style={{ fontSize: 12 * s, color: "#7A6F62", fontWeight: 700 }}>추천 상품</span>
        </div>
        <AdLabel />
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {products.map((p, i) => {
          const discount = Math.round((1 - p.price / p.origPrice) * 100);
          return (
            <a
              key={i}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                gap: 10,
                padding: 8,
                borderRadius: 10,
                border: "1px solid #F5EEE2",
              }}
            >
              <ProductThumb product={p} size={64} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12 * s,
                    fontWeight: 700,
                    color: "#1F1A14",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.35,
                    marginBottom: 4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11 * s, fontWeight: 900, color: "#E04545" }}>{discount}%</span>
                  <span style={{ fontSize: 13 * s, fontWeight: 900, color: "#1F1A14" }}>
                    {p.price.toLocaleString()}원
                  </span>
                </div>
                <RocketBadge size={10} />
              </div>
            </a>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid #F5EEE2",
          fontSize: 10 * s,
          color: "#9C907F",
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        쿠팡 파트너스 활동으로 일정액의 수수료를
        <br />
        제공받을 수 있습니다
      </div>
    </div>
  );
}

export function CoupangAdInline({
  product = COUPANG_PRODUCTS[0],
  compact = false,
}: {
  product?: CoupangProduct;
  compact?: boolean;
}) {
  const { fontScale: s } = useFontScale();
  const discount = Math.round((1 - product.price / product.origPrice) * 100);
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1.5px dashed #F2D7B5",
          padding: compact ? 14 : 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 10, right: 12 }}>
          <AdLabel />
        </div>
        <ProductThumb product={product} size={compact ? 72 : 88} />
        <div style={{ flex: 1, minWidth: 0, paddingRight: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11 * s, fontWeight: 900, color: "#2F86F6", letterSpacing: "-0.02em" }}>Coupang</span>
            <RocketBadge size={12} />
          </div>
          <div
            style={{
              fontSize: 14 * s,
              fontWeight: 800,
              color: "#1F1A14",
              letterSpacing: "-0.02em",
              lineHeight: 1.35,
              marginBottom: 6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.name}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13 * s, fontWeight: 900, color: "#E04545", letterSpacing: "-0.02em" }}>
              {discount}%
            </span>
            <span style={{ fontSize: 16 * s, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.02em" }}>
              {product.price.toLocaleString()}원
            </span>
            <span style={{ fontSize: 11 * s, color: "#9C907F", fontWeight: 600, textDecoration: "line-through" }}>
              {product.origPrice.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
