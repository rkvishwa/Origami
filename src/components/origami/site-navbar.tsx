"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
];

export function SiteNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-black/60 px-6 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black overflow-hidden transition-all group-hover:border-lime-300/40 group-hover:shadow-[0_0_12px_rgba(163,230,53,0.15)]">
            <Image src="/icon.png" alt="Origami" width={32} height={32} className="h-full w-full object-contain p-0.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Origami</span>
        </Link>

      </div>

      {/* Nav & CTA Group */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
                  isActive
                    ? "text-white bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-lime-300/70 to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <Link
          href="/workspace"
          className="hidden md:inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-1.5 text-sm font-semibold text-black transition-all hover:bg-lime-200 hover:shadow-[0_0_16px_rgba(163,230,53,0.35)]"
        >
          Open Workspace
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </header>
  );
}
