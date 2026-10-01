import type { HTMLAttributes, ReactNode } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  corners?: boolean;
  dither?: boolean;
}

/** Bordered panel with optional corner tick marks, matching TechText's selection-frame motif.
 *  `dither` overlays the same animated fractal-noise texture used on the global grain
 *  overlay, scoped to this panel, so bento cells read as "live" rather than static. */
export function Panel({ children, corners = true, dither = false, className = "", ...props }: PanelProps) {
  return (
    <div
      className={`relative border border-white/10 bg-white/[0.02] transition-colors duration-300 hover:border-accent/25 ${className}`}
      {...props}
    >
      {dither && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="dither-grain-local" />
        </div>
      )}
      {corners && (
        <>
          <span className="absolute -top-px -left-px z-10 h-2 w-2 border-t border-l border-accent/60" />
          <span className="absolute -top-px -right-px z-10 h-2 w-2 border-t border-r border-accent/60" />
          <span className="absolute -bottom-px -left-px z-10 h-2 w-2 border-b border-l border-accent/60" />
          <span className="absolute -bottom-px -right-px z-10 h-2 w-2 border-b border-r border-accent/60" />
        </>
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
