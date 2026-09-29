"use client";

import Link from "next/link";
import { PortalFieldCollection } from "@/shaders/portal-field/PortalFieldCollection";
import TechText from "@/components/TechText";
import DecryptedText from "@/components/DecryptedText";

export function Hero() {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-end overflow-hidden p-6 select-none sm:p-10 lg:p-12">
      <div className="absolute inset-0 z-0">
        <PortalFieldCollection
          speed={1.0}
          size={1.0}
          length={1.0}
          opacity={1.0}
          hue={0}
          saturation={1.0}
          brightness={1.0}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-[760px] flex-col items-end self-end pointer-events-auto">
        <div className="relative h-[150px] w-full sm:h-[190px] md:h-[220px]">
          <TechText
            text="ArbiStealth"
            fontWeight={700}
            fontSize={150}
            letterSpacing={-0.04}
            color="#ffffff"
            accentColor="#ffffff"
            reveal="letter"
            dashLength={4}
            dashGap={2}
            specks={15}
            selection={true}
            labels={true}
            draggable={true}
            sweep={true}
            speed={1}
            className="cursor-grab active:cursor-grabbing"
          />
        </div>

        <div className="mt-1 max-w-xl cursor-pointer text-right font-geist-mono text-xs tracking-wide text-neutral-400 sm:text-sm">
          <DecryptedText
            text="A PRIVACY-PRESERVING, AGENT-DRIVEN INTENT SETTLEMENT PROTOCOL ON ARBITRUM"
            speed={35}
            maxIterations={12}
            sequential={true}
            revealDirection="start"
            animateOn="inViewHover"
            className="text-neutral-400"
            encryptedClassName="text-accent font-mono font-medium"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="border border-accent/50 bg-accent/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-accent-light hover:bg-accent/20"
          >
            LAUNCH APP
          </Link>
          <a
            href="https://github.com/anbusan19/arbistealth"
            target="_blank"
            rel="noreferrer"
            className="border border-white/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-neutral-300 hover:border-white/30 hover:text-white"
          >
            VIEW SOURCE
          </a>
        </div>
      </div>
    </div>
  );
}
