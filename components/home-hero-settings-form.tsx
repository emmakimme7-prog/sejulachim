"use client";

import Image from "next/image";
import { useState } from "react";

import type { HomeHeroSettings } from "@/lib/mongodb/site-settings";
import { Field, FieldHint, FieldLabel, TextInput } from "@/components/ui/field";

export function HomeHeroSettingsForm({ initialSettings }: { initialSettings: HomeHeroSettings }) {
  const [title, setTitle] = useState(initialSettings.title);
  const [subtitle, setSubtitle] = useState(initialSettings.subtitle);
  const [useImage, setUseImage] = useState(initialSettings.useImage);
  const [imageUrl, setImageUrl] = useState(initialSettings.imageUrl ?? "");
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function resizeHeroImage(file: File) {
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

    const limit = 1200;
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
      // Prefer a compressed format so the request body stays small enough for admin saves.
      const formats: Array<{ type: "image/webp" | "image/jpeg"; qualities: number[] }> = [
        { type: "image/webp", qualities: [0.82, 0.72, 0.62, 0.52] },
        { type: "image/jpeg", qualities: [0.82, 0.72, 0.62, 0.52] }
      ];
      const maxDataUrlLength = 900_000;

      for (const format of formats) {
        for (const quality of format.qualities) {
          const encoded = canvas.toDataURL(format.type, quality);
          if (encoded.length <= maxDataUrlLength) {
            return encoded;
          }
        }
      }

      const fallback = canvas.toDataURL("image/jpeg", 0.42);
      if (fallback.length <= maxDataUrlLength) {
        return fallback;
      }

      throw new Error("IMAGE_TOO_LARGE");
    } catch {
      throw new Error("IMAGE_TOO_LARGE");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);

    const response = await fetch("/api/admin/home-hero", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, subtitle, useImage, imageUrl })
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setStatus({ tone: "error", message: result?.error ?? "메인 설정을 저장하지 못했습니다." });
      setPending(false);
      return;
    }

    setStatus({ tone: "success", message: "메인 설정을 저장했습니다." });
    setPending(false);
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <Field>
        <FieldLabel>메인 타이틀</FieldLabel>
        <TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="복잡한 뉴스 대신," maxLength={60} />
      </Field>

      <Field>
        <FieldLabel>서브타이틀</FieldLabel>
        <textarea
          value={subtitle}
          onChange={(event) => setSubtitle(event.target.value)}
          placeholder="세줄아침은 한국 사용자를 위한 생활형 아침 브리핑 서비스입니다."
          maxLength={220}
          className="min-h-32 w-full rounded-[28px] border border-navy-100 bg-white px-5 py-4 text-base text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
        />
      </Field>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-4 rounded-[28px] border border-navy-100 bg-navy-50 px-5 py-4">
          <div className="grid gap-1">
            <FieldLabel>메인 이미지 사용</FieldLabel>
            <FieldHint>끄면 타이틀과 설명이 메인 화면 전체 폭을 사용합니다.</FieldHint>
          </div>
          <button
            type="button"
            onClick={() => setUseImage((value) => !value)}
            aria-pressed={useImage}
            className={`inline-flex h-12 min-w-[104px] items-center justify-center rounded-full border px-4 text-sm font-semibold transition ${
              useImage
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-navy-200 bg-white text-navy-700"
            }`}
          >
            {useImage ? "켜짐" : "꺼짐"}
          </button>
        </div>
        <FieldLabel>메인 이미지 업로드</FieldLabel>
        <label className="flex cursor-pointer items-center justify-center rounded-[28px] border border-dashed border-navy-200 bg-white px-5 py-6 text-sm font-semibold text-navy-700 transition hover:border-orange-500 hover:bg-orange-50">
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
                const resizedImage = await resizeHeroImage(file);
                setImageUrl(resizedImage);
                setUseImage(true);
                setStatus(null);
              } catch {
                setStatus({ tone: "error", message: "메인 이미지가 너무 크거나 변환에 실패했습니다. 5MB 이하 이미지로 다시 시도해주세요." });
              }
            }}
          />
          이미지 파일 선택
        </label>
        {useImage && imageUrl ? (
          <div className="overflow-hidden rounded-[28px] border border-navy-100 bg-navy-50 p-3">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px]">
              <Image src={imageUrl} alt="메인 이미지 미리보기" fill className="object-contain" unoptimized />
            </div>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <FieldHint>대표 이미지를 업로드하면 홈 메인 화면 왼쪽에 바로 반영됩니다.</FieldHint>
          {imageUrl ? (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-sm font-semibold text-rose-700 underline underline-offset-4"
            >
              이미지 제거
            </button>
          ) : null}
        </div>
      </div>

      {status ? (
        <p className={status.tone === "success" ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-rose-700"}>
          {status.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-w-40 items-center justify-center rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "저장 중..." : "메인 설정 저장"}
        </button>
      </div>
    </form>
  );
}
