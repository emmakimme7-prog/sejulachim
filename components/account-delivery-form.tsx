"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

type Channel = "email" | "none";

function isValidEmailClient(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AccountDeliveryForm({
  initialChannel,
  initialEmail,
  initialMarketingConsent,
}: {
  initialChannel: Channel;
  initialEmail: string;
  initialMarketingConsent?: boolean;
}) {
  const computedInitial: Channel = initialMarketingConsent === false ? "none" : initialChannel;
  const [channel, setChannel] = useState<Channel>(computedInitial);
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const emailChannel = channel === "email";
  const noneChannel = channel === "none";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

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
          message: "미수신으로 설정되었습니다. 다시 받고 싶으시면 이메일을 선택하세요."
        });
      } catch {
        setStatus({ tone: "error", message: "네트워크 문제로 처리하지 못했습니다." });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!isValidEmailClient(email)) {
      setStatus({ tone: "error", message: "올바른 이메일 주소를 입력해주세요." });
      return;
    }

    setSubmitting(true);
    try {
      if (initialMarketingConsent === false) {
        await fetch("/api/account/marketing-consent", { method: "POST" });
      }
      const response = await fetch("/api/account/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          deliveryChannels: { email: true },
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
          </p>
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
                marginBottom: 10,
              }}
            />
            <p style={{ margin: 0, fontSize: 13, color: "#7A6F62", fontWeight: 600, lineHeight: 1.6 }}>
              메일함으로 매일 아침 보내드립니다.
            </p>
          </div>
        )}
      </div>

      {status ? <Notice tone={status.tone}>{status.message}</Notice> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "저장 중..." : noneChannel ? "미수신으로 변경" : "저장하기"}
        </Button>
      </div>
    </form>
  );
}
