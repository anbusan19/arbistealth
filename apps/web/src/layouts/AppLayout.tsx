import type { ReactNode } from "react";

/** Shared chrome for the functional app pages (dashboard, explorer, settings).
 *  Navigation is the global SiteMenu (hamburger, top-right), mounted once in
 *  the root layout — not per-page here. */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#040508] text-white">
      <main className="mx-auto max-w-[1600px] px-6 py-10 sm:px-12 lg:px-16">{children}</main>
    </div>
  );
}
