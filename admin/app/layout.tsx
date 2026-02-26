import type { Metadata } from "next";
import localFont from "next/font/local";

import { AdminShell } from "@/components/layout/admin-shell";
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
  title: "Admin | JS Solutions",
  description: "Consola administrativa de operaciones internas.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-brand-black font-[family-name:var(--font-geist-sans)] antialiased selection:bg-brand-gold selection:text-black`}
      >
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
