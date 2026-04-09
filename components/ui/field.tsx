import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Field({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn("grid gap-3", className)}>{children}</label>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="block text-base font-semibold text-orange-500">{children}</span>;
}

export function FieldHint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-base leading-7 text-navy-500", className)}>{children}</p>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-14 w-full rounded-3xl border border-navy-100 bg-white px-5 text-base text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100",
        props.className
      )}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "min-h-14 w-full rounded-3xl border border-navy-100 bg-white px-5 text-base text-navy-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100",
        props.className
      )}
    />
  );
}
