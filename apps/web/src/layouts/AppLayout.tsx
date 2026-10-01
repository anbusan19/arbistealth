import type { ReactNode } from "react";
import PixelBlast from "@/components/ui/PixelBlast";

/** Shared chrome for the functional app pages (dashboard, explorer, settings).
 *  Navigation is the global SiteMenu (hamburger, top-right), mounted once in
 *  the root layout — not per-page here. */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#040508] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-50">
        <PixelBlast
          variant="square"
          color="#6e87ed"
          pixelSize={4}
          patternScale={3}
          patternDensity={0.9}
          pixelSizeJitter={0.4}
          enableRipples
          rippleSpeed={0.35}
          rippleThickness={0.12}
          rippleIntensityScale={1.2}
          speed={0.35}
          edgeFade={0.35}
          transparent
        />
      </div>
      <main className="relative z-[1] w-full px-6 py-10 sm:px-10 lg:px-16 xl:px-20">{children}</main>
    </div>
  );
}
