"use client";

import Link from "next/link";
import { ArrowRight, GitFork } from "lucide-react";
import { Reveal } from "../components/ui/Reveal";

const COLUMNS: { heading: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Explorer", href: "/explorer" },
      { label: "Settings", href: "/settings" },
      { label: "Pitch Deck", href: "/pitch.html", external: true },
    ],
  },
  {
    heading: "Standards",
    links: [
      { label: "ERC-5564 (Stealth Addresses)", href: "https://eips.ethereum.org/EIPS/eip-5564", external: true },
      { label: "ERC-6538 (Meta-Address Registry)", href: "https://eips.ethereum.org/EIPS/eip-6538", external: true },
      { label: "ERC-8004 (Agent Identity)", href: "https://eips.ethereum.org/EIPS/eip-8004", external: true },
    ],
  },
  {
    heading: "Protocol",
    links: [
      { label: "Live Contracts", href: "/#contracts" },
      { label: "GitHub", href: "https://github.com/anbusan19/arbistealth", external: true },
      { label: "Arbiscan", href: "https://sepolia.arbiscan.io", external: true },
    ],
  },
];

export function CTAFooter() {
  return (
    <footer className="mt-24">
      {/* CTA band */}
      <section className="border-t border-white/10 bg-gradient-to-br from-accent/[0.07] via-transparent to-transparent px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <Reveal>
            <div>
              <span className="font-geist-mono text-[10px] tracking-[0.3em] text-accent/80 uppercase">
                Arbitrum Sepolia · Live Now
              </span>
              <h2 className="mt-4 max-w-xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
                Private settlement. Public accountability.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
                Submit a signed intent and see it settle to a stealth address you control.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/login"
                className="group flex items-center gap-2 border border-accent/50 bg-accent/10 px-6 py-3 font-geist-mono text-xs tracking-wide text-accent-light transition-colors hover:bg-accent/20"
              >
                LAUNCH APP
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <a
                href="https://github.com/anbusan19/arbistealth"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 border border-white/10 px-6 py-3 font-geist-mono text-xs tracking-wide text-neutral-300 transition-colors hover:border-white/30 hover:text-white"
              >
                VIEW SOURCE
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Link columns */}
      <section className="border-t border-white/10 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-10 sm:grid-cols-3">
          {COLUMNS.map((col, i) => (
            <Reveal key={col.heading} delay={0.05 * i}>
              <div>
                <h3 className="font-geist-mono text-[11px] tracking-wide text-neutral-500 uppercase">
                  {col.heading}
                </h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {col.links.map((link) =>
                    link.external ? (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-neutral-400 hover:text-white"
                        >
                          {link.label}
                        </a>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <Link href={link.href} className="text-sm text-neutral-400 hover:text-white">
                          {link.label}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Social row */}
      <div className="border-t border-white/10 px-6 py-6 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4">
          <a
            href="https://github.com/anbusan19/arbistealth"
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center border border-white/10 text-neutral-400 hover:border-white/30 hover:text-white"
            aria-label="GitHub"
          >
            <GitFork size={16} />
          </a>
        </div>
      </div>

      {/* Big watermark — same word as the hero wordmark, bled past all four edges */}
      <div className="h-[16vw] overflow-hidden text-center select-none sm:h-[13vw]">
        <span className="block leading-none font-bold tracking-tighter text-white/[0.05] text-[20vw] whitespace-nowrap">
          ArbiStealth
        </span>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 py-6 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-4 text-xs text-neutral-500 sm:flex-row sm:items-center">
          <span className="font-geist-mono">
            ARBISTEALTH © 2026 — ARBITRUM OPEN HOUSE SINGAPORE BUILDATHON
          </span>
          <span className="flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 font-geist-mono text-[10px] tracking-wide text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            ARBITRUM SEPOLIA · TESTNET
          </span>
        </div>
      </div>
    </footer>
  );
}
