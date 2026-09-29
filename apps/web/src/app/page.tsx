"use client";

import { Hero } from "@/sections/Hero";
import { Problem } from "@/sections/Problem";
import { Solution } from "@/sections/Solution";
import { Architecture } from "@/sections/Architecture";
import { LiveDeployment } from "@/sections/LiveDeployment";
import { CTAFooter } from "@/sections/CTAFooter";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#040508] text-white">
      <Hero />
      <Problem />
      <Solution />
      <Architecture />
      <LiveDeployment />
      <CTAFooter />
    </div>
  );
}
