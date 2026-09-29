import type { ReactNode } from "react";
import { Nav } from "../components/Nav";

/** Shared chrome for the functional app pages (dashboard, explorer, settings). */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#040508] text-white">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">{children}</main>
    </div>
  );
}
