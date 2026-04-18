"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, TextInput } from "@/components/ui/field";

export function AccountDeleteDialog({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-red-200 text-red-700 hover:bg-red-100"
        onClick={() => setOpen(true)}
      >
        회원탈퇴
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-5 py-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div ref={dialogRef} className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-gray-200 md:p-8">
            <h3 className="text-xl font-bold text-gray-900">정말 탈퇴하시겠어요?</h3>
            <div className="mt-3 space-y-2 text-base leading-7 text-gray-700">
              <p>탈퇴를 신청하면 <strong className="text-red-600">30일 후</strong> 모든 데이터가 영구 삭제됩니다.</p>
              <ul className="ml-1 list-disc space-y-1 pl-5 text-sm text-gray-600">
                <li>이메일, 비밀번호, 별명, 프로필 사진</li>
                <li>관심 주제 설정, 즐겨찾기, 공유 링크</li>
                <li>삭제된 데이터는 복구할 수 없습니다</li>
              </ul>
              <p className="text-sm text-gray-600">30일 이내에 다시 로그인하면 탈퇴가 자동으로 취소됩니다.</p>
            </div>

            <form method="post" action="/api/account/delete" className="mt-5 grid gap-4">
              {hasPassword ? (
                <Field>
                  <FieldLabel>비밀번호 확인</FieldLabel>
                  <TextInput type="password" name="password" autoComplete="current-password" required />
                </Field>
              ) : (
                <Field>
                  <FieldLabel>&ldquo;탈퇴합니다&rdquo;를 입력해주세요</FieldLabel>
                  <TextInput
                    type="text"
                    name="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </Field>
              )}
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); setConfirmText(""); }}>
                  닫기
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-100"
                  disabled={!hasPassword && confirmText !== "탈퇴합니다"}
                >
                  회원탈퇴
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
