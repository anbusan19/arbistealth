"use client";

// Raw Three.js port of the Dither background, mirroring PixelBlast.jsx's
// pattern (manual mount + rAF loop, no @react-three/fiber). The previous
// @react-three/fiber + @react-three/postprocessing version rendered its
// wave pattern and Bayer dithering as two separate passes through R3F's
// EffectComposer wrapper, and the autonomous time-based animation never
// advanced reliably through that pipeline. This version is a direct port of
// public/pitch.html's DitherBG — a single shader pass, confirmed animating
// there — so the two surfaces share one proven implementation.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./Dither.css";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec3 backgroundColor;
uniform vec2 mousePos;
uniform float enableMouseInteraction;
uniform float mouseRadius;
uniform float colorNum;
uniform float pixelSize;
varying vec2 vUv;

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = waveFrequency;
  for (int i = 0; i < 4; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= waveAmplitude;
  }
  return value;
}

float pattern(vec2 p) {
  vec2 p2 = p - time * waveSpeed;
  return fbm(p + fbm(p2));
}

const float bayerMatrix8x8[64] = float[64](
  0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
  32.0/64.0,16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0,19.0/64.0, 47.0/64.0, 31.0/64.0,
  8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0,59.0/64.0,  7.0/64.0, 55.0/64.0,
  40.0/64.0,24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0,27.0/64.0, 39.0/64.0, 23.0/64.0,
  2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0,49.0/64.0, 13.0/64.0, 61.0/64.0,
  34.0/64.0,18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0,17.0/64.0, 45.0/64.0, 29.0/64.0,
  10.0/64.0,58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0,57.0/64.0,  5.0/64.0, 53.0/64.0,
  42.0/64.0,26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0,25.0/64.0, 37.0/64.0, 21.0/64.0
);

vec3 ditherColor(vec2 fragCoord, vec3 color) {
  vec2 scaledCoord = floor(fragCoord / pixelSize);
  int x = int(mod(scaledCoord.x, 8.0));
  int y = int(mod(scaledCoord.y, 8.0));
  float threshold = bayerMatrix8x8[y*8+x] - 0.25;
  float step = 1.0 / (colorNum - 1.0);
  color += threshold * step;
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float bias = mix(0.2, 0.0, smoothstep(0.45, 0.8, luminance));
  color = clamp(color - bias, 0.0, 1.0);
  return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}

void main() {
  vec2 normalizedPixelSize = pixelSize / resolution;
  vec2 uvPixel = normalizedPixelSize * floor(vUv / normalizedPixelSize);
  vec2 p = uvPixel - 0.5;
  p.x *= resolution.x / resolution.y;
  float f = pattern(p);
  if (enableMouseInteraction > 0.5) {
    vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
    mouseNDC.x *= resolution.x / resolution.y;
    float dist = length(p - mouseNDC);
    float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
    f -= 0.5 * effect;
  }
  vec3 col = mix(backgroundColor, waveColor, clamp(f, 0.0, 1.0));
  col = ditherColor(gl_FragCoord.xy, col);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function Dither({
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = [0.5, 0.5, 0.5],
  backgroundColor = [0, 0, 0],
  colorNum = 4,
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 1,
}) {
  const containerRef = useRef(null);
  const propsRef = useRef(null);
  propsRef.current = {
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    waveColor,
    backgroundColor,
    colorNum,
    pixelSize,
    disableAnimation,
    enableMouseInteraction,
    mouseRadius,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      waveSpeed: { value: waveSpeed },
      waveFrequency: { value: waveFrequency },
      waveAmplitude: { value: waveAmplitude },
      waveColor: { value: new THREE.Color(...waveColor) },
      backgroundColor: { value: new THREE.Color(...backgroundColor) },
      mousePos: { value: new THREE.Vector2(0, 0) },
      enableMouseInteraction: { value: enableMouseInteraction ? 1 : 0 },
      mouseRadius: { value: mouseRadius },
      colorNum: { value: colorNum },
      pixelSize: { value: pixelSize },
    };

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Only one Y-flip belongs in this pipeline — the shader already flips
    // screen-space Y into NDC via mouseNDC's vec2(1.0,-1.0). Flipping here
    // too (as pitch.html's copy does) double-flips it, inverting the effect
    // vertically: top of screen reads as "down", bottom as "up".
    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      uniforms.mousePos.value.set(e.clientX - rect.left, e.clientY - rect.top);
    };
    container.addEventListener("pointermove", onPointerMove);

    const clock = new THREE.Clock();
    let raf = 0;
    let disposed = false;

    const tick = () => {
      if (disposed) return;
      const p = propsRef.current;
      if (!p.disableAnimation) uniforms.time.value = clock.getElapsedTime();
      if (uniforms.waveSpeed.value !== p.waveSpeed) uniforms.waveSpeed.value = p.waveSpeed;
      if (uniforms.waveFrequency.value !== p.waveFrequency) uniforms.waveFrequency.value = p.waveFrequency;
      if (uniforms.waveAmplitude.value !== p.waveAmplitude) uniforms.waveAmplitude.value = p.waveAmplitude;
      if (uniforms.colorNum.value !== p.colorNum) uniforms.colorNum.value = p.colorNum;
      if (uniforms.pixelSize.value !== p.pixelSize) uniforms.pixelSize.value = p.pixelSize;
      if (uniforms.mouseRadius.value !== p.mouseRadius) uniforms.mouseRadius.value = p.mouseRadius;
      uniforms.enableMouseInteraction.value = p.enableMouseInteraction ? 1 : 0;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentElement === container) container.removeChild(canvas);
    };
    // Intentionally mount-once: changing props updates the uniforms directly
    // via propsRef inside tick(), matching PixelBlast's reinit-on-key-props-only
    // pattern without needing to tear down the WebGL context every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="dither-container" />;
}
