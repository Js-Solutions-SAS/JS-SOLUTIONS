import type { Metadata } from "next";
import localFont from "next/font/local";
import { ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  LogOut,
} from "lucide-react";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Admin - JS Solutions",
  description: "Panel Administrativo Interno",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Clientes", href: "/clientes", icon: Users },
    {
      name: "Cotizaciones y Contratos",
      href: "/cotizaciones",
      icon: FileText,
    },
    { name: "SOPs y Recursos", href: "/sops", icon: BookOpen },
  ];

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-[family-name:var(--font-geist-sans)] selection:bg-neutral-900 selection:text-white`}
      >
        {/* Sidebar Desktop */}
        <aside className="w-full md:w-64 bg-white border-r border-neutral-200/60 flex-shrink-0 flex flex-col md:min-h-screen z-20 shadow-sm md:shadow-none relative">
          <div className="p-6 md:p-8 border-b border-neutral-100 flex items-center justify-between md:justify-center">
            <Link href="/" className="flex flex-col items-center">
              <span className="text-xl font-extrabold tracking-tight text-neutral-900 leading-none">
                JS SOLUTIONS
              </span>
              <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mt-1">
                Admin
              </span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto hidden md:block">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-600 font-medium hover:bg-neutral-50 hover:text-neutral-900 transition-all border border-transparent hover:border-neutral-100"
                >
                  <Icon className="w-5 h-5 text-neutral-400 group-hover:text-brand-gold transition-colors" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Card / Footer Sidebar */}
          <div className="p-4 border-t border-neutral-100 hidden md:block">
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-800 to-black flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  JS
                </div>
                <div className="text-left flex flex-col">
                  <span className="text-sm font-semibold text-neutral-900 leading-tight">
                    Administrador
                  </span>
                  <span className="text-xs text-neutral-500">
                    Panel Interno
                  </span>
                </div>
              </div>
              <LogOut className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-x-hidden min-h-[calc(100vh-80px)] md:min-h-screen">
          <div className="flex-1 p-4 sm:p-8 lg:p-12 w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation (Simple Fallback) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 flex items-center justify-around py-3 px-2 pb-[env(safe-area-inset-bottom)]">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                className="p-3 text-neutral-500 hover:text-brand-gold transition-colors flex flex-col items-center gap-1"
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] sm:hidden">
                  {item.name.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </nav>
      </body>
    </html>
  );
}
