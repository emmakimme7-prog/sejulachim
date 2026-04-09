"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

const FONT_STORAGE_KEY = "fontSize";
const FONT_EVENT_NAME = "slm-font-size-change";
const FONT_CLASSES = {
  small: "font-small",
  medium: "font-medium",
  large: "font-large"
} as const;

export type FontSizeValue = keyof typeof FONT_CLASSES;

function isFontSizeValue(value: string | null): value is FontSizeValue {
  return value === "small" || value === "medium" || value === "large";
}

function readFontSize(): FontSizeValue {
  if (typeof window === "undefined") {
    return "medium";
  }

  const saved = window.localStorage.getItem(FONT_STORAGE_KEY);
  return isFontSizeValue(saved) ? saved : "medium";
}

function applyFontSizeClass(value: FontSizeValue) {
  const root = document.documentElement;
  root.classList.remove(FONT_CLASSES.small, FONT_CLASSES.medium, FONT_CLASSES.large);
  root.classList.add(FONT_CLASSES[value]);
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener(FONT_EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(FONT_EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export function setGlobalFontSize(value: FontSizeValue) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FONT_STORAGE_KEY, value);
  applyFontSizeClass(value);
  window.dispatchEvent(new Event(FONT_EVENT_NAME));
}

export function useFontSize() {
  const fontSize = useSyncExternalStore<FontSizeValue>(subscribe, readFontSize, () => "medium");

  useEffect(() => {
    applyFontSizeClass(fontSize);
  }, [fontSize]);

  return {
    fontSize,
    setFontSize: setGlobalFontSize
  };
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const { fontSize } = useFontSize();

  useEffect(() => {
    applyFontSizeClass(fontSize);
  }, [fontSize]);

  return <>{children}</>;
}

export const fontSizeOptions: Array<{ value: FontSizeValue; label: string }> = [
  { value: "small", label: "작게" },
  { value: "medium", label: "보통" },
  { value: "large", label: "크게" }
];
