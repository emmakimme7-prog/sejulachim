"use client";

import Image from "next/image";
import { useState } from "react";

import { fontSizeOptions, type FontSizeValue, setGlobalFontSize } from "@/components/font-size-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { AVATAR_OPTIONS, type AvatarKey } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function AccountProfileForm({
  initialNickname,
  initialAvatarKey,
  initialFontSize,
  initialAvatarDataUrl
}: {
  initialNickname: string;
  initialAvatarKey: AvatarKey;
  initialFontSize: FontSizeValue;
  initialAvatarDataUrl?: string;
}) {
  const [nickname, setNickname] = useState(initialNickname);
  const [avatarKey, setAvatarKey] = useState<AvatarKey | "custom">(initialAvatarKey);
  const [avatarDataUrl, setAvatarDataUrl] = useState(initialAvatarDataUrl ?? "");
  const [fontSize, setFontSize] = useState<FontSizeValue>(initialFontSize);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function resizeProfileImage(file: File) {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("FILE_READ_FAILED"));
      };
      reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = document.createElement("img");
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
      element.src = rawDataUrl;
    });

    const limit = 512;
    const ratio = Math.min(limit / image.width, limit / image.height, 1);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return rawDataUrl;
    }

    context.drawImage(image, 0, 0, width, height);

    try {
      return canvas.toDataURL("image/jpeg", 0.82);
    } catch {
      return rawDataUrl;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, avatarKey, avatarDataUrl, fontSize })
      });

      const raw = await response.text();
      let payload: { error?: string; ok?: boolean } = {};
      if (raw) {
        try {
          payload = JSON.parse(raw) as { error?: string; ok?: boolean };
        } catch {
          payload = {};
        }
      }

      if (!response.ok) {
        setStatus(payload.error ?? "프로필을 저장하지 못했습니다.");
        return;
      }

      setGlobalFontSize(fontSize);
      setStatus("프로필 정보가 저장되었습니다.");
    } catch {
      setStatus("네트워크 문제로 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Field>
        <FieldLabel>별명</FieldLabel>
        <TextInput value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} />
      </Field>

      <div className="grid gap-3">
        <FieldLabel>프로필 사진</FieldLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AVATAR_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setAvatarKey(option.key)}
              className={cn(
                "rounded-[24px] border px-4 py-4 text-center transition",
                avatarKey === option.key ? "border-orange-500 bg-orange-50" : "border-navy-100 bg-white"
              )}
            >
              <div className="text-3xl">{option.emoji}</div>
              <p className="mt-2 text-sm font-semibold text-navy-800">{option.label}</p>
            </button>
          ))}
          <label
            className={cn(
              "rounded-[24px] border px-4 py-4 text-center transition cursor-pointer",
              avatarKey === "custom" ? "border-orange-500 bg-orange-50" : "border-navy-100 bg-white"
            )}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                try {
                  const resizedImage = await resizeProfileImage(file);
                  setAvatarDataUrl(resizedImage);
                  setAvatarKey("custom");
                  setStatus("");
                } catch {
                  setStatus("프로필 사진을 불러오지 못했습니다. 다른 사진으로 다시 시도해주세요.");
                }
              }}
            />
            <div className="flex h-[42px] items-center justify-center text-3xl">
              {avatarKey === "custom" && avatarDataUrl ? (
                <Image src={avatarDataUrl} alt="업로드한 프로필 사진" width={42} height={42} className="h-[42px] w-[42px] rounded-full object-cover" unoptimized />
              ) : (
                <span>📷</span>
              )}
            </div>
            <p className="mt-2 text-sm font-semibold text-navy-800">사진 업로드</p>
          </label>
        </div>
      </div>

      <div className="grid gap-3">
        <FieldLabel>기본 글씨 크기</FieldLabel>
        <div className="grid gap-3 sm:grid-cols-3">
          {fontSizeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFontSize(option.value);
                setGlobalFontSize(option.value);
              }}
              className={cn(
                "min-h-14 rounded-3xl border px-5 py-4 text-left text-lg font-bold transition",
                fontSize === option.value ? "border-orange-500 bg-orange-50 text-navy-900" : "border-navy-100 bg-white text-navy-800"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {status ? <Notice tone={status.includes("저장") && !status.includes("못") ? "success" : "error"}>{status}</Notice> : null}
      <p className="text-sm leading-7 text-navy-500">공유 시, 내 프로필 정보가 노출됩니다.</p>

      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting ? "저장 중입니다..." : "내 프로필 저장하기"}
      </Button>
    </form>
  );
}
