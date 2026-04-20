"use client";

import { useState } from "react";

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidPhone(value: string) {
  return /^010\d{8}$/.test(value.replace(/\D/g, ""));
}

export function CompletePhoneForm({ email }: { email: string }) {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidPhone(phone)) {
      setStatus("error");
      setMessage("올바른 휴대폰번호(010-XXXX-XXXX)를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/account/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ""),
          email,
          deliveryChannels: { kakao: true, email: false },
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setStatus("error");
        setMessage(payload.error ?? "저장하지 못했습니다.");
        return;
      }
      setStatus("success");
      setMessage("번호가 등록되었습니다. 내일 아침부터 알림톡을 받아보실 수 있어요.");
    } catch {
      setStatus("error");
      setMessage("네트워크 문제로 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          padding: "16px 18px",
          borderRadius: 14,
          background: "#E8F5EC",
          border: "1.5px solid #B7E0C3",
          color: "#2E7D3F",
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.6,
          marginBottom: 20,
        }}
      >
        ✅ {message}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "18px",
        borderRadius: 16,
        background: "#FFF8EC",
        border: "1.5px solid #F2E6D7",
        marginBottom: 20,
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 900, color: "#B2570F", marginBottom: 4, letterSpacing: "0.03em" }}>
        📱 카카오톡 알림톡 받기
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#1F1A14", marginBottom: 8, letterSpacing: "-0.01em" }}>
        알림톡 받을 휴대폰번호를 알려주세요
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#7A6F62", fontWeight: 500, lineHeight: 1.6 }}>
        본인 명의 번호를 입력해주세요. 등록 후 설정에서 언제든 변경할 수 있습니다.
      </p>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        value={phone}
        onChange={(e) => { setPhone(formatPhone(e.target.value)); setStatus("idle"); }}
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
          marginBottom: 10,
        }}
      />
      {status === "error" ? (
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#C2185B", fontWeight: 700 }}>{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          minHeight: 50,
          background: submitting ? "#E8DCC7" : "#E57C23",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 900,
          letterSpacing: "-0.01em",
          cursor: submitting ? "not-allowed" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {submitting ? "저장 중..." : "번호 등록하기"}
      </button>
    </form>
  );
}
