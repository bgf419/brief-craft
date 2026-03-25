"use client";

import React from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#6366f1] text-white hover:bg-[#818cf8] active:bg-[#6366f1] border-transparent",
  secondary:
    "bg-transparent text-[#e5e5e5] border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1e1e1e]",
  danger:
    "bg-[#ef4444] text-white hover:bg-[#dc2626] active:bg-[#ef4444] border-transparent",
  ghost:
    "bg-transparent text-[#999] hover:text-[#e5e5e5] hover:bg-[#1e1e1e] border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-base gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/40 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
