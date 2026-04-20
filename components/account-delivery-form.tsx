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

type Channel = "kakao" | "email" | "none";

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
  initialMarketingConsent,
}: {
  initialChannel: Channel;
  initialPhone: string;
  initialEmail: string;
  initialMarketingConsent?: boolean;
}) {
  // marketing_consent 가 없으면 "미수신" 상태로 표시
  const computedInitial: Channel = initialMarketingConsent === false ? "none" : initialChannel;
  const [channel, setChannel] = useState<Channel>(computedInitial);
  const [phone, setPhone] = useState(initialPhone ? formatPhone(initialPhone) : "");
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const kakaoChannel = channel === "kakao";
  const emailChannel = channel === "email";
  const noneChannel = channel === "none";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    // 미수신 선택 시 광고성 정보 수신 동의 철회 API 호출.
    if (noneChannel) {
      const confirmed = window.confirm(
        "미수신으로 설정하시면 매일 아침 소식이 더 이상 발송되지 않습니다.\n\n계속하시겠습니까?"
      );
      if (!confirmed) return;
      setSubmitting(true);
      try {
        const response = await fetch("/api/account/marketing-consent", { method: "DELETE" });
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) {
          setStatus({ tone: "error", message: payload.error ?? "처리하지 못했습니다." });
          return;
        }
        setStatus({
          tone: "success",
          message: "미수신으로 설정되었습니다. 다시 받고 싶으시면 카카오톡 또는 이메일을 선택하세요."
        });
      } catch {
        setStatus({ tone: "error", message: "네트워크 문제로 처리하지 못했습니다." });
      } finally {
        setSubmitting(false);
      }
      return;
    }

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
      // 이전에 미수신 상태였을 수 있으므로 먼저 수신 동의 복구(marketing_consent_at 재세팅).
      if (initialMarketingConsent === false) {
        await fetch("/api/account/marketing-consent", { method: "POST" });
      }
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
            gridTemplateColumns: "1fr 1fr 1fr",
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
              gap: 6,
              minHeight: 48,
              padding: "0 8px",
              borderRadius: 10,
              background: kakaoChannel ? "#FEE500" : "transparent",
              color: "#1F1A14",
              border: "none",
              fontSize: 14,
              fontWeight: kakaoChannel ? 900 : 700,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, font-weight 0.15s",
            }}
          >
            <KakaoMark size={18} />
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
              gap: 6,
              minHeight: 48,
              padding: "0 8px",
              borderRadius: 10,
              background: emailChannel ? "#FFF2E3" : "transparent",
              color: "#1F1A14",
              border: "none",
              fontSize: 14,
              fontWeight: emailChannel ? 900 : 700,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, font-weight 0.15s",
            }}
          >
            <span style={{ fontSize: 14 }} aria-hidden="true">📧</span>
            이메일
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={noneChannel}
            onClick={() => { setChannel("none"); setStatus(null); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: 48,
              padding: "0 8px",
              borderRadius: 10,
              background: noneChannel ? "#E8DCC7" : "transparent",
              color: noneChannel ? "#1F1A14" : "#7A6F62",
              border: "none",
              fontSize: 14,
              fontWeight: noneChannel ? 900 : 700,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, font-weight 0.15s",
            }}
          >
            <span style={{ fontSize: 14 }} aria-hidden="true">🔕</span>
            미수신
          </button>
        </div>

        {noneChannel ? (
          <p style={{ margin: 0, fontSize: 13, color: "#7A6F62", fontWeight: 600, lineHeight: 1.6 }}>
            미수신으로 설정하면 매일 아침 소식이 <b style={{ color: "#1F1A14" }}>발송되지 않습니다</b>.
            저장하시면 광고성 정보 수신 동의가 철회됩니다.
          </p>
        ) : kakaoChannel ? (
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
    </form>
  );
}
