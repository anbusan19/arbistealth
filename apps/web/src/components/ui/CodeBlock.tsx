import type { ReactNode } from "react";

/** Terminal-chrome code block — same window styling as Solution.tsx's StagePanel,
 *  generalized to take arbitrary pre-formatted children instead of a mock UI. */
export function CodeBlock({ path, children }: { path: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden border border-white/10 bg-[#07080a]">
      <div className="flex items-center gap-4 border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-white/20" />
          <span className="h-2.5 w-2.5 rounded-full border border-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
        </div>
        <span className="font-geist-mono text-[11px] text-neutral-500">{path}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-geist-mono text-[12px] leading-relaxed text-neutral-300">
        {children}
      </pre>
    </div>
  );
}
