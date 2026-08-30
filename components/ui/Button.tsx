"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary" // noir : CTA principal
  | "violet" // violet plein
  | "secondary" // blanc bordé
  | "soft" // violet très clair
  | "ghost" // transparent
  | "danger"; // rouge doux

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-white hover:bg-black active:scale-[0.98] shadow-[0_8px_20px_-8px_rgba(23,22,28,0.45)]",
  /* CTA jaune ComeUp : fond #FFEE66, texte noir */
  violet:
    "bg-primary-300 text-ink hover:bg-primary-400 active:scale-[0.98] shadow-[0_8px_20px_-8px_rgba(202,138,4,0.45)]",
  secondary:
    "bg-white text-ink border border-line hover:border-ink/20 hover:bg-canvas active:scale-[0.98]",
  soft: "bg-primary-50 text-primary-700 hover:bg-primary-100 active:scale-[0.98]",
  ghost: "bg-transparent text-ink-soft hover:bg-ink/5 hover:text-ink active:scale-[0.98]",
  danger: "bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98]",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-sm gap-2 rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        variants[variant],
        sizes[size],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
