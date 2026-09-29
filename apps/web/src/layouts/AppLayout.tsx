"use client";

import type { ReactNode } from "react";
import { PortalFieldCollection } from "@/shaders/portal-field/PortalFieldCollection";

/** Shared chrome for the functional app pages (dashboard, explorer, settings).
 *  Navigation is the global SiteMenu (hamburger, top-right), mounted once in
 *  the root layout — not per-page here. A low-opacity animated bell-field
 *  ambient background keeps these pages alive rather than flat black. */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040508] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <PortalFieldCollection variant="bell-field" speed={0.35} opacity={1} />
      </div>
      <main className="relative mx-auto max-w-[1600px] px-6 py-10 sm:px-12 lg:px-16">{children}</main>
    </div>
  );
}
