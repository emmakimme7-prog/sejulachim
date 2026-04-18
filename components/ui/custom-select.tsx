"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "선택",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div
        role="combobox"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((prev) => !prev); } }}
        className={cn(
          "flex min-h-10 w-full cursor-pointer items-center justify-between gap-1 rounded-xl border bg-white px-3 text-xs transition select-none",
          open
            ? "border-orange-400 ring-2 ring-orange-100"
            : "border-navy-100 hover:border-navy-300",
          selected ? "text-navy-900" : "text-navy-400"
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-navy-400 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </div>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-full min-w-[120px] overflow-hidden rounded-xl border border-navy-100 bg-white py-1 shadow-[0px_4px_6px_rgba(0,0,0,0.07),0px_2px_4px_rgba(0,0,0,0.05)]">
          {options.map((option) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs transition",
                option.value === value
                  ? "bg-orange-50 font-semibold text-orange-600"
                  : "text-navy-700 hover:bg-navy-50"
              )}
            >
              {option.value === value ? (
                <Check className="h-3 w-3 shrink-0 text-orange-500" aria-hidden="true" />
              ) : (
                <span className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{option.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
