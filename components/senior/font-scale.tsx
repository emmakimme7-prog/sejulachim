"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SCALE_MAP, type SizeKey } from "./tokens";

type Ctx = {
  currentSize: SizeKey;
  fontScale: number;
  setSize: (s: SizeKey) => void;
};

const FontScaleCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "senior.fontSize";

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [currentSize, setCurrentSize] = useState<SizeKey>("medium");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "small" || v === "medium" || v === "large") setCurrentSize(v);
    } catch {}
  }, []);

  const setSize = useCallback((s: SizeKey) => {
    setCurrentSize(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {}
  }, []);

  return (
    <FontScaleCtx.Provider value={{ currentSize, fontScale: SCALE_MAP[currentSize], setSize }}>
      {children}
    </FontScaleCtx.Provider>
  );
}

export function useFontScale() {
  const ctx = useContext(FontScaleCtx);
  if (!ctx) throw new Error("useFontScale must be used within FontScaleProvider");
  return ctx;
}
