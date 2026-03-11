"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils";

interface SnackbarProps {
  open: boolean;
  title: string;
  message: string;
  tone?: "success" | "error";
  onClose: () => void;
}

export function Snackbar({
  open,
  title,
  message,
  tone = "success",
  onClose,
}: SnackbarProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 2600);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed right-4 top-4 z-[80]">
      <div
        className={cn(
          "min-w-[280px] rounded-xl border px-4 py-3 shadow-2xl backdrop-blur",
          tone === "success"
            ? "border-emerald-400/30 bg-brand-charcoal text-emerald-200"
            : "border-rose-400/30 bg-brand-charcoal text-rose-200",
        )}
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs opacity-80">{message}</p>
      </div>
    </div>
  );
}
