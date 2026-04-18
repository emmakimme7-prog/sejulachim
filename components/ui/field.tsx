import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Field({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn("grid gap-2", className)}>{children}</label>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="block text-sm font-semibold text-gray-700">{children}</span>;
}

export function FieldHint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm leading-6 text-gray-500", className)}>{children}</p>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100",
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
        "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100",
        props.className
      )}
    />
  );
}
