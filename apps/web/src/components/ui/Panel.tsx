import type { HTMLAttributes, ReactNode } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  corners?: boolean;
}

/** Bordered panel with optional corner tick marks, matching TechText's selection-frame motif. */
export function Panel({ children, corners = true, className = "", ...props }: PanelProps) {
  return (
    <div
      className={`relative border border-white/10 bg-white/[0.02] transition-colors duration-300 hover:border-accent/25 ${className}`}
      {...props}
    >
      {corners && (
        <>
          <span className="absolute -top-px -left-px h-2 w-2 border-t border-l border-accent/60" />
          <span className="absolute -top-px -right-px h-2 w-2 border-t border-r border-accent/60" />
          <span className="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-accent/60" />
          <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-accent/60" />
        </>
      )}
      {children}
    </div>
  );
}
