import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "ClearFile",
  description: "Invoice automation, extraction, review, and e-signing.",
};

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#0a0f1a] text-slate-100 antialiased">
        <div className="relative isolate min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_28%)]" />
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.18)_1px,transparent_0)] [background-size:24px_24px]" />

          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0f1a]/70 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-sm font-black text-slate-950 shadow-lg shadow-teal-900/30">
                  C
                </div>
                <span className="text-lg font-semibold tracking-tight text-white">ClearFile</span>
              </Link>

              <NavLinks />
            </nav>
          </header>

          <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>

          <footer className="relative z-10 border-t border-white/10 py-6 text-center text-sm text-slate-400">
            Built for modern finance operations — secure, compliant, and ready to scale.
          </footer>
        </div>
      </body>
    </html>
  );
}