"use client";

import { useState } from "react";
import { Pause, Play, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

export function AdminUserStatusButton({
  userId,
  isActive,
  iconOnly = false
}: {
  userId: string;
  isActive: boolean;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) {
        setToast("사용자 상태를 저장하지 못했습니다.");
        return;
      }

      setShowConfirm(false);
      router.refresh();
    } catch {
      setToast("사용자 상태를 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-navy-200 bg-white px-4 text-sm font-semibold text-navy-800 transition hover:border-navy-300 hover:bg-navy-50"
        aria-label={isActive ? "사용자 일시중지" : "사용자 다시 시작"}
        title={isActive ? "일시중지" : "다시 시작"}
      >
        {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {iconOnly ? null : <span>{isActive ? "일시중지" : "다시 시작"}</span>}
      </button>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/45 px-5 py-8" onClick={() => setShowConfirm(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-navy-100"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">상태 변경</p>
                <h2 className="mt-2 text-2xl font-extrabold text-navy-900">
                  {isActive ? "이 사용자를 일시중지할까요?" : "이 사용자를 다시 시작할까요?"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-navy-600">
                  {isActive ? "일시중지하면 아침 메일 발송이 중단됩니다." : "다시 시작하면 예약 시간부터 메일 발송이 재개됩니다."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-navy-200 bg-white text-navy-900"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" fullWidth onClick={handleConfirm} disabled={submitting}>
                {submitting ? "처리 중입니다..." : isActive ? "일시중지하기" : "다시 시작하기"}
              </Button>
              <Button type="button" variant="outline" fullWidth onClick={() => setShowConfirm(false)}>
                취소
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <Toast message={toast} tone="error" /> : null}
    </>
  );
}
