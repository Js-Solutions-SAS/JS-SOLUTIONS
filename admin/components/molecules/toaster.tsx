"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      theme="dark"
      toastOptions={{
        className:
          "!border !border-white/15 !bg-brand-charcoal !text-brand-off-white",
      }}
    />
  );
}
