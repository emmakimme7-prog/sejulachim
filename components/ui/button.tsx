import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-gray-900 text-white hover:bg-gray-800 active:bg-black",
  secondary: "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-600",
  outline: "border border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-lg px-3.5 text-sm font-semibold",
  md: "min-h-11 rounded-xl px-5 text-base font-semibold",
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
        "inline-flex items-center justify-center gap-2 whitespace-normal text-center transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
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
