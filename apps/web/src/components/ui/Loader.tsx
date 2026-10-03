interface LoaderProps {
  label?: string;
  size?: "sm" | "md";
}

/** Stealth-scan loader: a radar-sweep ring inside the panel corner-tick motif,
 *  evoking the protocol's "scanning for announcements" mental model rather
 *  than a generic spinner. No reactbits dependency. */
export function Loader({ label, size = "md" }: LoaderProps) {
  const dim = size === "sm" ? "h-6 w-6" : "h-9 w-9";

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${dim} shrink-0`}>
        <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-accent/60" />
        <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-accent/60" />
        <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-accent/60" />
        <span className="absolute right-0 bottom-0 h-2 w-2 border-r border-b border-accent/60" />

        <span className="absolute inset-[3px] rounded-full border border-accent/15" />
        <span
          className="absolute inset-[3px] animate-spin rounded-full [animation-duration:1.6s]"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, var(--color-accent) 35deg, transparent 90deg)",
            WebkitMaskImage: "radial-gradient(circle, transparent 55%, black 56%)",
            maskImage: "radial-gradient(circle, transparent 55%, black 56%)",
          }}
        />
        <span className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-accent" />
      </div>
      {label && <span className="font-geist-mono text-[10px] tracking-wide text-neutral-500">{label}</span>}
    </div>
  );
}
