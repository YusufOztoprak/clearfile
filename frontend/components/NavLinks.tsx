"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const navLinks = [
  { href: "/review", label: "Review" },
  { href: "/archive", label: "Archive" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/audit", label: "Audit" },
];

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`relative py-1 text-sm font-medium transition-colors ${
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      {isActive && <span className="absolute -bottom-[15px] left-0 h-0.5 w-full bg-primary" />}
    </Link>
  );
}

export default function NavLinks() {
  return (
    <nav className="flex items-center gap-7">
      {navLinks.map((link) => (
        <NavLink key={link.href} href={link.href}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
