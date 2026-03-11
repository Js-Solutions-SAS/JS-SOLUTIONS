import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "pending" | "progress" | "success" | "neutral";
}

const toneStyles = {
  pending: "border-amber-400/30 bg-amber-400/15 text-amber-200",
  progress: "border-blue-400/30 bg-blue-400/15 text-blue-200",
  success: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
  neutral: "border-white/15 bg-white/5 text-brand-off-white/85",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
