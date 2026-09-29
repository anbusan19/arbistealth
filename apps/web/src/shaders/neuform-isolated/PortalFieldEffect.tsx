"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

/**
 * Single-effect port of arbifrontend's neuform-isolated "Portal Field"
 * (NeuformBatchEffects.tsx's EFFECTS.portalField). The original loads its
 * HTML/WebGL source via Vite's `?raw` import; Turbopack has no equivalent,
 * so this fetches the same source from public/effects/portal-field.html at
 * runtime instead and renders it the same way — patched, then wrapped in an
 * isolating iframe document. Visually and behaviorally identical to the
 * original; only the source-loading mechanism differs.
 */
export type PortalFieldEffectProps = {
  speed?: number;
  size?: number;
  length?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
};

const DEFAULTS = {
  speed: 1,
  size: 1,
  length: 1,
  opacity: 1,
  hue: 0,
  saturation: 1,
  brightness: 1,
} as const;

const BACKGROUND = "#05060a";
const TARGET_SELECTOR = "#webgl-container";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

/** WebGL1 GLSL ES requires float literals (10.0), not ints (10). */
function glslFloat(value: number, digits = 3) {
  const fixed = Number(value).toFixed(digits);
  return fixed.includes(".") ? fixed : `${fixed}.0`;
}

function patchPortalField(source: string, size: number, length: number) {
  return source
    .replace(
      "float d1 = sdArc(st, center, 0.6, 0.02, 0.15);",
      `float d1 = sdArc(st, center, ${glslFloat(0.6 * length, 3)}, ${glslFloat(0.02 * size, 4)}, 0.15);`
    )
    .replace(
      "float d2 = sdArc(st, center, 0.65, 0.06, 0.2);",
      `float d2 = sdArc(st, center, ${glslFloat(0.65 * length, 3)}, ${glslFloat(0.06 * size, 4)}, 0.2);`
    );
}

function buildFocusedDocument(rawSource: string, size: number, length: number) {
  const targetJson = JSON.stringify([{ selector: TARGET_SELECTOR, role: "background" }]).replace(/</g, "\\u003c");
  const patchedSource = patchPortalField(rawSource, size, length);

  const focusStyle = `<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${BACKGROUND} !important; }
body { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
body > * { visibility: hidden !important; }
body[data-threeui-ready] > [data-threeui-role] { visibility: visible !important; }
[data-threeui-residual] { display: none !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; }
</style>`;

  const controlScript = `<script data-threeui-controls>
(function () {
  var controls = { speed: ${DEFAULTS.speed}, opacity: ${DEFAULTS.opacity} };
  window.__SF_CONTROLS = controls;
  var origin = performance.now();
  var virtual = 0;
  var last = origin;
  var performanceNow = performance.now.bind(performance);
  var dateNow = Date.now.bind(Date);
  var dateOrigin = dateNow();
  performance.now = function () {
    var real = performanceNow();
    virtual += (real - last) * (controls.speed || 1);
    last = real;
    return origin + virtual;
  };
  Date.now = function () {
    return dateOrigin + (performance.now() - origin);
  };
  var raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (callback) {
    return raf(function () {
      callback(performance.now());
    });
  };
  function applyVisual() {
    var opacity = controls.opacity == null ? 1 : controls.opacity;
    Array.prototype.forEach.call(document.querySelectorAll("[data-threeui-role]"), function (element) {
      element.style.opacity = String(opacity);
    });
  }
  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "threeui-controls") return;
    var next = event.data.controls || {};
    Object.keys(next).forEach(function (key) { controls[key] = next[key]; });
    applyVisual();
  });
  window.__SF_APPLY_CONTROLS = applyVisual;
})();
</script>`;

  const focusScript = `<script data-threeui-focus>
(function () {
  var isolated = false;
  function isolate() {
    if (isolated) return;
    var specs = ${targetJson};
    var roots = [];
    specs.forEach(function (spec) {
      var element = document.querySelector(spec.selector);
      if (!element) return;
      element.setAttribute("data-threeui-role", spec.role);
      if (!roots.some(function (root) { return root.contains(element); })) roots.push(element);
    });
    if (!roots.length) return;
    isolated = true;
    roots.forEach(function (root) { document.body.appendChild(root); });
    Array.from(document.body.children).forEach(function (element) {
      if (roots.indexOf(element) !== -1) return;
      element.setAttribute("data-threeui-residual", "");
      element.setAttribute("aria-hidden", "true");
      if ("inert" in element) element.inert = true;
    });
    document.body.setAttribute("data-threeui-ready", "");
    if (window.__SF_APPLY_CONTROLS) window.__SF_APPLY_CONTROLS();
    requestAnimationFrame(function () { window.dispatchEvent(new Event("resize")); });
  }
  function scheduleIsolation() { setTimeout(isolate, 100); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleIsolation, { once: true });
  else scheduleIsolation();
  window.addEventListener("load", isolate, { once: true });
})();
</script>`;

  return patchedSource
    .replace(/<head([^>]*)>/i, `<head$1>${controlScript}${focusStyle}`)
    .replace(/<\/body>/i, `${focusScript}</body>`);
}

export function PortalFieldEffect({
  speed = DEFAULTS.speed,
  size = DEFAULTS.size,
  length = DEFAULTS.length,
  opacity = DEFAULTS.opacity,
  hue = DEFAULTS.hue,
  saturation = DEFAULTS.saturation,
  brightness = DEFAULTS.brightness,
  className,
  style,
}: PortalFieldEffectProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [rawSource, setRawSource] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/effects/portal-field.html")
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) setRawSource(text);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const safeSpeed = clamp(speed, 0, 3);
  const safeSize = clamp(size, 0.05, 200);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeOpacity = clamp(opacity, 0.05, 1);
  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);

  const document_ = useMemo(
    () => (rawSource ? buildFocusedDocument(rawSource, safeSize, safeLength) : null),
    [rawSource, safeSize, safeLength]
  );

  useEffect(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      { type: "threeui-controls", controls: { speed: safeSpeed, opacity: safeOpacity } },
      "*"
    );
  }, [safeSpeed, safeOpacity, document_]);

  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  if (!document_) {
    return <div className={className} style={{ width: "100%", height: "100%", background: BACKGROUND, ...style }} />;
  }

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title="Portal Field"
      srcDoc={document_}
      sandbox="allow-scripts"
      loading="eager"
      style={{ display: "block", width: "100%", height: "100%", border: 0, background: BACKGROUND, filter, ...style }}
    />
  );
}

export default PortalFieldEffect;
