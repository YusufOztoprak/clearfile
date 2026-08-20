import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";

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
      <body className="min-h-screen bg-[#f3f5f4] text-slate-900 antialiased">
        <div className="relative isolate min-h-screen overflow-hidden">
          <Header />
          <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>
          <footer className="relative z-10 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
            Built for modern finance operations — secure, compliant, and ready to scale.
          </footer>
        </div>
      </body>
    </html>
  );
}