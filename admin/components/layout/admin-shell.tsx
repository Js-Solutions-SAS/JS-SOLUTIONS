"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  UsersRound,
  X,
} from "lucide-react";

import { AppToaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Entregas", href: "/entregas", icon: CalendarClock },
  { name: "Capacidad", href: "/capacidad", icon: UsersRound },
  { name: "RAID", href: "/raid", icon: ShieldAlert },
  { name: "Cotizaciones", href: "/cotizaciones", icon: FileText },
  { name: "SOPs", href: "/sops", icon: BookOpen },
];

function getBreadCrumbs(pathname: string) {
  if (pathname === "/") return [{ label: "Dashboard", href: "/" }];

  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, array) => {
      const href = `/${array.slice(0, index + 1).join("/")}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);

      return { label, href };
    });
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const breadcrumbs = useMemo(() => getBreadCrumbs(pathname), [pathname]);

  return (
    <div className="min-h-screen bg-brand-black text-brand-off-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold/10 blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen">
        <aside
          className={cn(
            "hidden border-r border-white/10 bg-brand-charcoal/95 backdrop-blur md:flex md:flex-col md:transition-all",
            collapsed ? "md:w-20" : "md:w-72",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            {!collapsed && (
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.svg" alt="JS Solutions" width={34} height={34} className="h-8 w-auto" priority />
                <div>
                  <p className="text-sm font-bold tracking-wide text-white">JS Solutions</p>
                  <p className="text-[11px] uppercase tracking-wider text-brand-gold">Admin Console</p>
                </div>
              </Link>
            )}

            {collapsed && (
              <Link href="/" className="mx-auto">
                <Image src="/logo.svg" alt="JS Solutions" width={30} height={30} className="h-7 w-auto" />
              </Link>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label="Colapsar sidebar"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gold-gradient text-black shadow-[0_0_20px_rgba(212,175,55,0.18)]"
                      : "text-brand-off-white/80 hover:bg-white/5 hover:text-white",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <Icon className={cn("h-5 w-5", !collapsed && "mr-2")} />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-brand-black/80 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
              <div className="flex items-center gap-2 md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Abrir navegación"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Image src="/logo.svg" alt="JS Solutions" width={24} height={24} className="h-6 w-auto" />
                  <span className="text-sm font-semibold text-white">JS Solutions Admin</span>
                </div>
              </div>

              <nav className="hidden items-center gap-1 text-sm text-brand-off-white/70 md:flex">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight className="h-4 w-4" />}
                    <Link
                      href={crumb.href}
                      className={cn(
                        "rounded px-2 py-1 hover:bg-white/5",
                        index === breadcrumbs.length - 1 && "font-semibold text-brand-gold",
                      )}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>
          </header>

          <section className="mx-auto w-full max-w-7xl p-4 pb-10 pt-6 sm:p-8">{children}</section>
        </main>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter") {
              setMobileOpen(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú móvil"
        >
          <div
            className="h-full w-72 border-r border-white/10 bg-brand-charcoal p-4"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            role="presentation"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/logo.svg" alt="JS Solutions" width={24} height={24} className="h-6 w-auto" />
                <p className="text-sm font-bold text-white">Navegacion</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-gold-gradient text-black"
                        : "text-brand-off-white/80 hover:bg-white/5 hover:text-white",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AppToaster />
    </div>
  );
}
