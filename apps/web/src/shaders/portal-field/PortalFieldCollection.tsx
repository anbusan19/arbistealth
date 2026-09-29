"use client";

import { lazy, Suspense } from "react";

import type { PortalFieldEffectProps } from "../neuform-isolated/PortalFieldEffect";
import type { BellFieldBackgroundProps } from "../bell-field/BellFieldBackground";
import type { StreamConvergenceBackgroundProps } from "../stream-convergence/StreamConvergenceBackground";

/**
 * Trimmed to the variants ArbiStealth actually uses. The original
 * arbifrontend collection also offered "flow-field" / "cloud-field", which
 * load their WebGL scenes from Vite `?raw` HTML imports (see
 * neuform-isolated/PortalFieldEffect.tsx's doc comment) — only the
 * hero's "portal-field" was ported (as a runtime fetch instead of a
 * build-time raw import), alongside the two dependency-free variants.
 */
export type PortalFieldVariant = "portal-field" | "bell-field" | "stream-convergence";

type PortalVariantProps = PortalFieldEffectProps & {
  variant?: "portal-field";
};

type BellVariantProps = BellFieldBackgroundProps & {
  variant: "bell-field";
};

type StreamVariantProps = StreamConvergenceBackgroundProps & {
  variant: "stream-convergence";
};

export type PortalFieldCollectionProps = PortalVariantProps | BellVariantProps | StreamVariantProps;

const PortalVariant = lazy(() =>
  import("../neuform-isolated/PortalFieldEffect").then((module) => ({ default: module.PortalFieldEffect }))
);

const BellVariant = lazy(() =>
  import("../bell-field/BellFieldBackground").then((module) => ({ default: module.BellFieldBackground }))
);

const StreamVariant = lazy(() =>
  import("../stream-convergence/StreamConvergenceBackground").then((module) => ({
    default: module.StreamConvergenceBackground,
  }))
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

  if (props.variant === "bell-field") {
    return (
      <Suspense fallback={FALLBACK}>
        <BellVariant {...variantProps} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={FALLBACK}>
      <PortalVariant {...variantProps} />
    </Suspense>
  );
}
