"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/budget", label: "Budget" },
  { href: "/transactions", label: "Transactions" },
  { href: "/upload", label: "Upload Statement" },
  { href: "/categories", label: "Categories" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border-hairline bg-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            Tracking Finances
          </Link>
          <nav className="flex gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-[#2a78d6]/10 text-[#2a78d6] font-medium"
                      : "text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
