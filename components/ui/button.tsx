import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-navy-900 text-white shadow-[0_10px_30px_rgba(17,32,51,0.18)] hover:bg-navy-700",
  secondary: "bg-orange-500 text-white shadow-[0_10px_30px_rgba(229,124,35,0.18)] hover:bg-orange-400",
  outline: "border border-navy-200 bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50",
  ghost: "bg-transparent text-navy-800 hover:bg-navy-50"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-10 rounded-2xl px-4 text-sm font-semibold",
  md: "min-h-12 rounded-2xl px-5 text-base font-semibold",
  lg: "min-h-14 rounded-full px-6 text-lg font-bold"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-normal text-center transition disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
