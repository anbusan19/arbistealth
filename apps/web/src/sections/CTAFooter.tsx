"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../components/ui/Reveal";

export function CTAFooter() {
  return (
    <section className="px-6 py-32 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center text-center">
        <Reveal>
          <span className="font-geist-mono text-[10px] tracking-[0.3em] text-accent/80 uppercase">
            Arbitrum Sepolia · Live Now
          </span>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mt-6 max-w-3xl text-4xl font-medium tracking-tight text-white sm:text-5xl lg:text-6xl">
            Private settlement. Public accountability.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-neutral-400">
            Submit a signed intent and see it settle to a stealth address you control.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <Link
            href="/login"
            className="group mt-10 flex items-center gap-2 border border-accent/50 bg-accent/10 px-7 py-3.5 font-geist-mono text-xs tracking-wide text-accent-light transition-colors hover:bg-accent/20"
          >
            LAUNCH APP
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-24 flex w-full flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-neutral-500 sm:flex-row">
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
