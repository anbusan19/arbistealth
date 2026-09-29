import Link from "next/link";

export function CTAFooter() {
  return (
    <section className="border-t border-white/10 px-6 py-20 sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
        <div>
          <h2 className="max-w-md text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Private settlement. Public accountability.
          </h2>
          <p className="mt-3 max-w-md text-sm text-neutral-400">
            Submit a signed intent and see it settle to a stealth address you control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="border border-accent/50 bg-accent/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-accent-light hover:bg-accent/20"
          >
            LAUNCH APP
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-neutral-500 sm:flex-row sm:items-center">
        <span className="font-geist-mono">ARBISTEALTH — ARBITRUM OPEN HOUSE SINGAPORE BUILDATHON</span>
        <div className="flex gap-4 font-geist-mono">
          <a href="https://github.com/anbusan19/arbistealth" target="_blank" rel="noreferrer" className="hover:text-white">
            GITHUB
          </a>
          <a href="https://sepolia.arbiscan.io" target="_blank" rel="noreferrer" className="hover:text-white">
            ARBISCAN
          </a>
        </div>
      </div>
    </section>
  );
}
