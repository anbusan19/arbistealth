"use client";

import { lazy, Suspense } from "react";

import type { BellFieldBackgroundProps } from "../bell-field/BellFieldBackground";
import type { StreamConvergenceBackgroundProps } from "../stream-convergence/StreamConvergenceBackground";

/**
 * Trimmed to the two variants ArbiStealth actually uses. The original
 * arbifrontend collection also offered "portal-field" / "flow-field" /
 * "cloud-field", but those load their WebGL scenes from Vite `?raw` HTML
 * imports (see the retired neuform-isolated/ folder) — a bundler feature
 * this Next.js app doesn't use, so they were dropped rather than ported.
 */
export type PortalFieldVariant = "bell-field" | "stream-convergence";

type BellVariantProps = BellFieldBackgroundProps & {
  variant?: "bell-field";
};

type StreamVariantProps = StreamConvergenceBackgroundProps & {
  variant: "stream-convergence";
};

export type PortalFieldCollectionProps = BellVariantProps | StreamVariantProps;

const BellVariant = lazy(() =>
  import("../bell-field/BellFieldBackground").then((module) => ({ default: module.BellFieldBackground })),
);

const StreamVariant = lazy(() =>
  import("../stream-convergence/StreamConvergenceBackground").then((module) => ({
    default: module.StreamConvergenceBackground,
  })),
);

const FALLBACK = <div className="threeui-background portal-field" />;

export function PortalFieldCollection(props: PortalFieldCollectionProps) {
  const { variant: _variant, ...variantProps } = props;

  if (props.variant === "stream-convergence") {
    return (
      <Suspense fallback={FALLBACK}>
        <StreamVariant {...variantProps} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={FALLBACK}>
      <BellVariant {...variantProps} />
    </Suspense>
  );
}
