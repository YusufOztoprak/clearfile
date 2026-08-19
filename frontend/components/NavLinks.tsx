"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={
        isActive
          ? "rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/10"
          : "rounded-full px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
      }
    >
      {children}
    </Link>
  );
}

export default function NavLinks() {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <NavLink href="/">Home</NavLink>
      <NavLink href="/upload">Upload</NavLink>
      <NavLink href="/dashboard">Dashboard</NavLink>
      <NavLink href="/review">Review</NavLink>
      <NavLink href="/archive">Archive</NavLink>
    </div>
  );
}