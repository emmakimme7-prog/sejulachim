"use client";

import { MessageCircle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const WIDGET_VERSION = "20260406-01";
const DEFAULT_WIDGET_ORIGIN = "https://chathub.studiobyyou.kr";
export function ChatHubInquiryWidget() {
  const [open, setOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isLocalHost =
    typeof window !== "undefined" && (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");

  const widgetUrl = useMemo(() => {
    const customUrl = process.env.NEXT_PUBLIC_CHATHUB_WIDGET_URL?.trim();
    if (customUrl) {
      return customUrl;
    }

    const source =
      typeof window === "undefined"
        ? "sejulachim.studiobyyou.kr"
        : `${window.location.host}${window.location.pathname}${window.location.search}`;
    const origin = process.env.NEXT_PUBLIC_CHATHUB_ORIGIN?.trim() || DEFAULT_WIDGET_ORIGIN;
    const url = new URL("/customer", origin);
    url.searchParams.set("workspace", "sejulachim");
    url.searchParams.set("embed", "1");
    url.searchParams.set("source", source);
    url.searchParams.set("v", WIDGET_VERSION);
    return url.toString();
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "chathub-close-widget") {
        setOpen(false);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!open || !iframeRef.current) {
      return;
    }

    const origin = process.env.NEXT_PUBLIC_CHATHUB_ORIGIN?.trim() || DEFAULT_WIDGET_ORIGIN;
    iframeRef.current.contentWindow?.postMessage(
      {
        type: "chathub-open-widget"
      },
      origin
    );
  }, [open]);

  function handleToggle() {
    if (isLocalHost) {
      window.location.assign(widgetUrl);
      return;
    }

    setOpen((current) => !current);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex h-14 w-14 flex-nowrap items-center justify-center gap-2 rounded-full bg-navy-900 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(17,32,51,0.24)] transition hover:bg-navy-800 sm:min-w-[154px] sm:px-5"
        aria-label={open ? "문의 창 닫기" : "문의하기"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="hidden shrink-0 whitespace-nowrap leading-none sm:inline">문의하기</span>
      </button>
      {open ? (
        <iframe
          ref={iframeRef}
          src={widgetUrl}
          title="ChatHub 채팅 문의"
          className="fixed bottom-[11rem] left-4 right-4 z-40 h-[min(640px,calc(100dvh-13.5rem))] w-auto rounded-[24px] border-0 bg-transparent shadow-[0_24px_60px_rgba(17,32,51,0.22)] sm:bottom-[8.5rem] sm:left-auto sm:right-6 sm:w-[min(380px,calc(100vw-2rem))] sm:rounded-[28px]"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null}
    </>
  );
}
