"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LineSidebar } from "./ui/LineSidebar";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
];

/** Replaces the old top Nav bar entirely: just a hamburger icon, fixed
 *  top-right on every page, revealing the LineSidebar content directly on
 *  click — no background panel, no wallet button. */
export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const activeIndex = LINKS.findIndex((link) => link.href === pathname);

  return (
    <div ref={panelRef} className="fixed top-6 right-6 z-50 flex flex-col items-end gap-4">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-white/10 bg-[#040508]/80 backdrop-blur hover:border-accent/40"
      >
        <span
          className={`block h-px w-5 bg-white transition-transform duration-200 ${open ? "translate-y-[7px] rotate-45" : ""}`}
        />
        <span className={`block h-px w-5 bg-white transition-opacity duration-150 ${open ? "opacity-0" : ""}`} />
        <span
          className={`block h-px w-5 bg-white transition-transform duration-200 ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
        />
      </button>

      {open && (
        <LineSidebar
          items={LINKS.map((l) => l.label)}
          align="right"
          accentColor="#6e87ed"
          textColor="#94a3b8"
          markerColor="#334155"
          defaultActive={activeIndex >= 0 ? activeIndex : null}
          markerLength={40}
          itemGap={16}
          fontSize={0.95}
          onItemClick={(index) => router.push(LINKS[index].href)}
        />
      )}
    </div>
  );
}
