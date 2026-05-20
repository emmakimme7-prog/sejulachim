"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Copy, MessageCircle, QrCode, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldHint, FieldLabel } from "@/components/ui/field";
import { Toast } from "@/components/ui/toast";
import { fetchSessionCached } from "@/lib/auth/session-client";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_SDK_ID = "kakao-share-sdk";

export function CompleteShareButton({
  shareUrl,
  shareSlugs,
  interestSummary,
  buttonLabel = "지인에게 공유하기",
  iconOnly = false,
  mobileIconOnly = false,
  triggerClassName = "",
  modalTitle = "지인에게 세줄아침을 알려보세요.",
  hideMessage = false
}: {
  shareUrl?: string;
  shareSlugs?: string[];
  interestSummary: string;
  buttonLabel?: string;
  iconOnly?: boolean;
  mobileIconOnly?: boolean;
  triggerClassName?: string;
  modalTitle?: string;
  hideMessage?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [kakaoReady, setKakaoReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [resolvedShareUrl, setResolvedShareUrl] = useState(shareUrl ?? "");
  const [shareKey, setShareKey] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [isQrOpen, setIsQrOpen] = useState(false);

  const normalizedDirectShareUrl = useMemo(() => {
    if (!shareUrl) {
      return "";
    }

    if (/^https?:\/\//i.test(shareUrl)) {
      return shareUrl;
    }

    if (typeof window === "undefined") {
      return shareUrl;
    }

    return new URL(shareUrl, window.location.origin).toString();
  }, [shareUrl]);

  const appKey =
    typeof document === "undefined"
      ? process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY
      : document.body.dataset.kakaoKey || process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!appKey) {
      return;
    }

    function bootKakao() {
      if (!appKey) {
        return;
      }

      if (!window.Kakao) {
        return;
      }

      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(appKey);
      }

      setKakaoReady(true);
    }

    const existing = document.getElementById(KAKAO_SDK_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.Kakao) {
        bootKakao();
      } else {
        existing.addEventListener("load", bootKakao, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_SDK_ID;
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.9/kakao.min.js";
    script.async = true;
    script.onload = bootKakao;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [appKey]);

  useEffect(() => {
    // QA: 동일 페이지에서 4곳이 /api/auth/session polling. module cache 로 공유.
    fetchSessionCached()
      .then((d) => {
        if ((d as { session?: unknown } | null)?.session) setIsLoggedIn(true);
      })
      .catch(() => undefined);
  }, []);

  const qrImageUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(resolvedShareUrl)}`,
    [resolvedShareUrl]
  );

  async function ensureShareUrl() {
    if (normalizedDirectShareUrl) {
      setResolvedShareUrl(normalizedDirectShareUrl);
      return normalizedDirectShareUrl;
    }

    if (!shareSlugs?.length) {
      throw new Error("MISSING_SHARE_URL");
    }

    setIsCreatingLink(true);
    try {
      const response = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareKey: shareKey ?? undefined, slugs: shareSlugs, message: shareMessage.trim() || undefined })
      });
      const data = await response.json();
      if (!response.ok || !data.shareUrl) {
        throw new Error(data.error || "SHARE_LINK_CREATE_FAILED");
      }
      setShareKey(typeof data.shareKey === "string" ? data.shareKey : null);
      setResolvedShareUrl(data.shareUrl);
      return data.shareUrl as string;
    } finally {
      setIsCreatingLink(false);
    }
  }

  async function logShareEvent(event: "open" | "copy_link" | "copy_qr" | "kakao", urlOverride?: string) {
    try {
      await fetch("/api/share/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, url: urlOverride || resolvedShareUrl })
      });
    } catch {
      // ignore logging failures
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(successMessage);
      return;
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "true");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setToast(successMessage);
    }
  }

  async function copyQrImage() {
    try {
      const url = await ensureShareUrl();
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`);
      const blob = await response.blob();

      if ("ClipboardItem" in window) {
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        void logShareEvent("copy_qr", url);
        setToast("QR 이미지를 복사했습니다.");
        return;
      }
    } catch {
      // fall through to link copy
    }

    await copyText(await ensureShareUrl(), "QR 대신 공유 링크를 복사했습니다.");
  }

  async function openKakaoShare() {
    const currentShareUrl = await ensureShareUrl();
    const description = [interestSummary, "아침마다 세 줄의 뉴스 정보 받아보기"].filter(Boolean).join("\n");
    const messageBlock = shareMessage.trim() ? `${shareMessage.trim()}\n` : "";

    if (!window.Kakao || !kakaoReady) {
      void copyText(currentShareUrl, "카카오 공유 대신 링크를 복사했습니다.");
      return;
    }

    try {
      void logShareEvent("kakao", currentShareUrl);
      window.Kakao.Share.sendDefault({
        objectType: "text",
        text: ["세줄아침", `${messageBlock}${description}`.trim(), currentShareUrl].filter(Boolean).join("\n"),
        link: {
          mobileWebUrl: currentShareUrl,
          webUrl: currentShareUrl
        },
        buttons: [
          {
            title: "아침마다 세 줄의 뉴스 정보 받아보기",
            link: {
              mobileWebUrl: currentShareUrl,
              webUrl: currentShareUrl
            }
          }
        ]
      });
    } catch {
      void copyText(currentShareUrl, "카카오 공유 대신 링크를 복사했습니다.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          try {
            const currentShareUrl = await ensureShareUrl();
            void logShareEvent("open", currentShareUrl);
          } catch {
            setToast("공유 링크를 만들지 못했습니다.");
            return;
          }
          setIsOpen(true);
        }}
        aria-label={buttonLabel || "공유하기"}
        className={`inline-flex flex-nowrap items-center justify-center rounded-2xl transition ${
          iconOnly
            ? "h-10 w-10 rounded-full border border-gray-300 bg-white px-0 py-0 text-gray-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            : "h-10 gap-2 rounded-full border border-gray-300 bg-white px-3.5 text-sm font-semibold text-gray-800 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
        } ${triggerClassName}`.trim()}
      >
        {iconOnly ? (
          <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <Share2 className="h-[18px] w-[18px]" />
          </span>
        ) : (
          <>
            <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
              <Share2 className="h-[18px] w-[18px]" />
            </span>
            <span className={`shrink-0 whitespace-nowrap leading-none ${mobileIconOnly ? "hidden sm:inline" : ""}`}>{buttonLabel}</span>
          </>
        )}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-5 py-8" onClick={() => setIsOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-gray-200 md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">공유</p>
                <h2 id="share-modal-title" className="mt-1 text-base font-bold text-gray-900 sm:text-lg">
                  {modalTitle}
                </h2>
              </div>
              <button
                type="button"
                aria-label="공유 모달 닫기"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {!hideMessage && isLoggedIn ? (
                <div className="rounded-[28px] bg-gray-50 p-5">
                  <FieldLabel>선택 사항으로 함께 전달할 메세지를 작성해주세요</FieldLabel>
                  <textarea
                    value={shareMessage}
                    onChange={(event) => setShareMessage(event.target.value.slice(0, 50))}
                    placeholder="함께 전하고 싶은 말을 50자 안에서 남겨보세요"
                    className="mt-3 min-h-24 w-full rounded-[24px] border border-gray-200 bg-white px-5 py-4 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                  <FieldHint className="mt-2 text-right">{shareMessage.length}/50</FieldHint>
                </div>
              ) : null}

              <div className="rounded-[28px] bg-gray-50 p-5">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const currentShareUrl = await ensureShareUrl();
                      void logShareEvent("copy_link", currentShareUrl);
                      await copyText(currentShareUrl, "공유 링크를 복사했습니다.");
                    }}
                    className="flex min-h-16 flex-col items-center justify-center rounded-[24px] border border-gray-200 bg-white px-3 py-4 text-sm font-bold text-gray-900 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    <Copy className="mb-2 h-5 w-5 text-orange-500" />
                    <span>URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await ensureShareUrl();
                        setIsQrOpen(true);
                      } catch {
                        setToast("공유 링크를 만들지 못했습니다.");
                      }
                    }}
                    className="flex min-h-16 flex-col items-center justify-center rounded-[24px] border border-gray-200 bg-white px-3 py-4 text-sm font-bold text-gray-900 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    <QrCode className="mb-2 h-5 w-5 text-orange-500" />
                    <span>QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={openKakaoShare}
                    className="flex min-h-16 flex-col items-center justify-center rounded-[24px] bg-[#FEE500] px-3 py-4 text-sm font-extrabold text-[#191919] transition hover:brightness-95"
                  >
                    <MessageCircle className="mb-2 h-5 w-5" />
                    <span>카카오톡</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isQrOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/45 px-5 py-8" onClick={() => setIsQrOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="QR 코드 보기"
            className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-gray-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-bold text-gray-900">QR 코드</h3>
              <button
                type="button"
                aria-label="QR 모달 닫기"
                onClick={() => setIsQrOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 rounded-[28px] border border-gray-200 bg-gray-50 p-5">
              <div className="flex justify-center rounded-[24px] bg-white p-4">
                {resolvedShareUrl ? (
                  <Image src={qrImageUrl} alt="세줄아침 공유 QR 코드" width={220} height={220} unoptimized className="h-[220px] w-[220px]" />
                ) : (
                  <div className="flex h-[220px] w-[220px] items-center justify-center text-sm font-semibold text-gray-600">
                    {isCreatingLink ? "링크를 준비하고 있습니다." : "공유 링크를 준비하고 있습니다."}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-center">
                <Button type="button" variant="outline" onClick={() => void copyQrImage()}>
                  복사하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
