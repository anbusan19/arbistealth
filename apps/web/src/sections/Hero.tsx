"use client";

import { useState } from "react";
import Link from "next/link";
import Dither from "@/components/ui/Dither";
import TechText from "@/components/TechText";
import DecryptedText from "@/components/DecryptedText";
import { joinMainnetWaitlist } from "@/lib/relayer";

function MainnetWaitlist() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await joinMainnetWaitlist(email);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <span className="border border-accent/50 bg-accent/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-white">
        YOU&apos;RE ON THE LIST
      </span>
    );
  }

  if (open) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-48 border border-white/10 bg-black/40 px-3 py-2.5 font-geist-mono text-xs tracking-wide text-neutral-200 placeholder:text-neutral-500 focus:border-accent/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="border border-accent/50 bg-accent/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-white hover:bg-accent/20 disabled:opacity-40"
        >
          {status === "loading" ? "JOINING…" : "NOTIFY ME"}
        </button>
        {status === "error" && (
          <span className="font-geist-mono text-xs tracking-wide text-red-400">failed, retry</span>
        )}
      </form>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="border border-white/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-white hover:border-accent/40"
    >
      JOIN MAINNET WAITLIST
    </button>
  );
}

export function Hero() {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-end overflow-hidden p-6 select-none sm:p-10 lg:p-12">
      <div className="absolute inset-0 z-0">
        <Dither
          waveColor={[0.43529411764705883, 0.6509803921568628, 0.8235294117647058]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.2}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-[760px] flex-col items-start self-start pointer-events-auto">
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

        <div className="mt-1 max-w-xl cursor-pointer text-left font-geist-mono text-xs tracking-wide text-white sm:text-sm">
          <DecryptedText
            text="A PRIVACY-PRESERVING, AGENT-DRIVEN INTENT SETTLEMENT PROTOCOL ON ARBITRUM"
            speed={35}
            maxIterations={12}
            sequential={true}
            revealDirection="start"
            animateOn="inViewHover"
            className="text-white"
            encryptedClassName="text-accent font-mono font-medium"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="border border-accent/50 bg-accent/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-white hover:bg-accent/20"
          >
            LAUNCH APP
          </Link>
          <a
            href="https://github.com/anbusan19/arbistealth"
            target="_blank"
            rel="noreferrer"
            className="border border-white/10 px-5 py-2.5 font-geist-mono text-xs tracking-wide text-white hover:border-white/30"
          >
            VIEW SOURCE
          </a>
          <MainnetWaitlist />
        </div>
      </div>
    </div>
  );
}
