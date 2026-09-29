interface SectionLabelProps {
  index?: string;
  children: string;
}

/** Small mono uppercase tag used to open every landing section, matching the DecryptedText subtext style. */
export function SectionLabel({ index, children }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-3 font-geist-mono text-xs tracking-[0.2em] text-accent/80 uppercase">
      {index && <span className="text-white/30">{index}</span>}
      <span>{children}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent" />
    </div>
  );
}
