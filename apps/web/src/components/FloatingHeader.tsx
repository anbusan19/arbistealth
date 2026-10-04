"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explorer", label: "Explorer" },
  { href: "/settings", label: "Settings" },
  { href: "/pitch", label: "Pitch" },
];

/** Replaces the old hamburger + right-side dropdown: a single floating bar,
 *  fixed top-right on every page, with nav links and the wallet button
 *  inline — no expand/collapse state, no click-outside handling. */
export function FloatingHeader() {
  const pathname = usePathname();

  return (
    <div className="fixed top-6 right-6 z-50">
      <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-[#040508]/80 px-2 py-1.5 uppercase backdrop-blur">
        {LINKS.map((link) => {
          const active = link.href === pathname;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 font-geist-mono text-xs tracking-wide ${
                active ? "text-accent-light" : "text-neutral-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <span className="h-4 w-px bg-white/10" aria-hidden="true" />
        <ConnectButton className="mx-1 rounded-full" />
      </nav>
    </div>
  );
}
