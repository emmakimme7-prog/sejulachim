"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

function KakaoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#3C1E1E" aria-hidden="true">
      <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.72 1.74 5.12 4.39 6.51l-.9 3.3c-.08.29.23.52.48.37l3.93-2.6c.69.09 1.39.14 2.1.14 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
    </svg>
  );
}

type Channel = "kakao" | "email";

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidPhoneClient(value: string) {
  return /^010\d{8}$/.test(value.replace(/\D/g, ""));
}

function isValidEmailClient(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AccountDeliveryForm({
  initialChannel,
  initialPhone,
  initialEmail,
}: {
  initialChannel: Channel;
  initialPhone: string;
  initialEmail: string;
}) {
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [phone, setPhone] = useState(initialPhone ? formatPhone(initialPhone) : "");
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const kakaoChannel = channel === "kakao";
  const emailChannel = channel === "email";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (kakaoChannel && !isValidPhoneClient(phone)) {
      setStatus({ tone: "error", message: "올바른 휴대폰번호(010-XXXX-XXXX)를 입력해주세요." });
      return;
    }
    if (emailChannel && !isValidEmailClient(email)) {
      setStatus({ tone: "error", message: "올바른 이메일 주소를 입력해주세요." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/account/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: kakaoChannel ? phone.replace(/\D/g, "") : null,
          email: emailChannel ? email.trim() : null,
          deliveryChannels: { kakao: kakaoChannel, email: emailChannel },
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setStatus({ tone: "error", message: payload.error ?? "저장하지 못했습니다." });
        return;
      }
      setStatus({ tone: "success", message: "알림 설정이 저장되었습니다." });
    } catch {
      setStatus({ tone: "error", message: "네트워크 문제로 저장하지 못했습니다." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">알림 받는 방법</h2>
        <p className="mt-3 text-base leading-7 text-gray-600">
          매일 아침 7시 30분에 세 줄 브리핑을 보내드립니다.
        </p>
      </div>

      {/* 변경 — depth 분리된 카드 */}
      <div
        style={{
          padding: 18,
          borderRadius: 20,
          background: "#F5EEE2",
          border: "1.5px solid #EAD9BF",
        }}
      >
        <div
          role="radiogroup"
          aria-label="받는 방법 변경"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            padding: 4,
            borderRadius: 14,
            background: "#fff",
            border: "1.5px solid #E8DCC7",
            marginBottom: 14,
          }}
        >
          <button
            type="button"
            role="radio"
            aria-checked={kakaoChannel}
            onClick={() => { setChannel("kakao"); setStatus(null); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 48,
              padding: "0 14px",
              borderRadius: 10,
              background: kakaoChannel ? "#FEE500" : "transparent",
              color: "#1F1A14",
              border: "none",
              fontSize: 15,
              fontWeight: kakaoChannel ? 900 : 700,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, font-weight 0.15s",
            }}
          >
            <KakaoMark size={20} />
            카카오톡
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={emailChannel}
            onClick={() => { setChannel("email"); setStatus(null); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 48,
              padding: "0 14px",
              borderRadius: 10,
              background: emailChannel ? "#FFF2E3" : "transparent",
              color: "#1F1A14",
              border: "none",
              fontSize: 15,
              fontWeight: emailChannel ? 900 : 700,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, font-weight 0.15s",
            }}
          >
            <span style={{ fontSize: 16 }} aria-hidden="true">📧</span>
            이메일
          </button>
        </div>

        {kakaoChannel ? (
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#4A4037", marginBottom: 6, letterSpacing: "-0.01em" }}>
              휴대폰번호
            </label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhone(e.target.value));
                setStatus(null);
              }}
              placeholder="010-1234-5678"
              style={{
                width: "100%",
                minHeight: 52,
                padding: "0 16px",
                background: "#fff",
                border: "2px solid #E8DCC7",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: "#1F1A14",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#7A6F62", fontWeight: 600, lineHeight: 1.5 }}>
              알림톡으로 매일 아침 7:30에 뉴스 요약과 제휴 상품 안내를 보내드립니다.
            </p>
          </div>
        ) : (
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#4A4037", marginBottom: 6, letterSpacing: "-0.01em" }}>
              이메일
            </label>
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus(null);
              }}
              placeholder="example@email.com"
              style={{
                width: "100%",
                minHeight: 52,
                padding: "0 16px",
                background: "#fff",
                border: "2px solid #E8DCC7",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                color: "#1F1A14",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#7A6F62", fontWeight: 600, lineHeight: 1.5 }}>
              메일함으로 매일 아침 보내드립니다.
            </p>
          </div>
        )}
      </div>

      {status ? <Notice tone={status.tone}>{status.message}</Notice> : null}

      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting ? "저장 중입니다..." : "알림 설정 저장하기"}
      </Button>

      <div
        style={{
          marginTop: 4,
          padding: "12px 14px",
          borderRadius: 10,
          background: "#FFF8EC",
          border: "1px solid #F2E6D7",
          fontSize: 12,
          color: "#7A6F62",
          lineHeight: 1.6,
          fontWeight: 500,
        }}
      >
        📢 <b>광고성 정보 수신 동의 상태</b> — 매일 뉴스와 제휴 상품 안내를 받으시는 데 동의하셨습니다.
        수신을 원하지 않으시면{" "}
        <a href="/account?tab=delete" style={{ color: "#B2570F", fontWeight: 800, textDecoration: "underline" }}>
          구독 해지
        </a>
        하거나 이메일 하단의 수신거부 링크를 사용해 주세요.
      </div>
    </form>
  );
}
