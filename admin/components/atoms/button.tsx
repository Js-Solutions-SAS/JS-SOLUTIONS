import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "success";
type ButtonSize = "default" | "sm";

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-gold-gradient text-black hover:brightness-110 focus-visible:ring-brand-gold/35 shadow-[0_0_20px_rgba(212,175,55,0.18)]",
  outline:
    "border border-white/15 bg-white/5 text-brand-off-white hover:border-brand-gold/50 hover:text-white focus-visible:ring-brand-gold/20",
  ghost:
    "text-brand-off-white/75 hover:bg-white/5 hover:text-white focus-visible:ring-brand-gold/20",
  success: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500/25",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
