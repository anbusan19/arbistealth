interface LoaderProps {
  label?: string;
  size?: "sm" | "md";
}

/** Custom scan-line loader matching the panel corner-tick motif — no reactbits dependency. */
export function Loader({ label, size = "md" }: LoaderProps) {
  const dim = size === "sm" ? "h-6 w-6" : "h-9 w-9";

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${dim} shrink-0`}>
        <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-accent/60" />
        <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-accent/60" />
        <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-accent/60" />
        <span className="absolute right-0 bottom-0 h-2 w-2 border-r border-b border-accent/60" />
        <span className="absolute inset-x-0 h-px animate-[loader-scan_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-accent to-transparent" />
      </div>
      {label && <span className="font-geist-mono text-[10px] tracking-wide text-neutral-500">{label}</span>}
    </div>
  );
}
