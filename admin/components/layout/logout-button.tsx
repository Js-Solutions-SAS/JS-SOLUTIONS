"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  collapsed?: boolean;
  mobile?: boolean;
}

export function LogoutButton({ collapsed = false, mobile = false }: LogoutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("[AUTH_LOGOUT] logout request failed", error);
    }

    window.location.assign("/login");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={mobile ? "default" : "sm"}
      className={cn(
        "w-full justify-start border border-white/10 bg-white/[0.02] hover:bg-white/10",
        collapsed && !mobile && "justify-center px-2",
      )}
      onClick={handleLogout}
      disabled={pending}
      aria-label="Cerrar sesion"
    >
      <LogOut className={cn("h-4 w-4", !collapsed || mobile ? "mr-2" : "mr-0")} />
      {(!collapsed || mobile) && (pending ? "Cerrando..." : "Cerrar sesion")}
    </Button>
  );
}
