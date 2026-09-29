"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../components/ui/Reveal";

export function CTAFooter() {
  return (
    <section className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/15 via-white/[0.02] to-transparent p-10 sm:p-16">
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <h2 className="max-w-md text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  Private settlement. Public accountability.
                </h2>
                <p className="mt-3 max-w-md text-sm text-neutral-400">
                  Submit a signed intent and see it settle to a stealth address you control.
                </p>
              </div>

              <Link
                href="/login"
                className="group flex shrink-0 items-center gap-2 border border-accent/50 bg-accent/10 px-6 py-3 font-geist-mono text-xs tracking-wide text-accent-light transition-colors hover:bg-accent/20"
              >
                LAUNCH APP
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-neutral-500 sm:flex-row sm:items-center">
            <span className="font-geist-mono">ARBISTEALTH — ARBITRUM OPEN HOUSE SINGAPORE BUILDATHON</span>
            <div className="flex gap-4 font-geist-mono">
              <a
                href="https://github.com/anbusan19/arbistealth"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                GITHUB
              </a>
              <a href="https://sepolia.arbiscan.io" target="_blank" rel="noreferrer" className="hover:text-white">
                ARBISCAN
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
