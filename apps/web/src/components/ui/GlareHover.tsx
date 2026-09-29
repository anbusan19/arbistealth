import type { CSSProperties, ReactNode } from "react";
import "./GlareHover.css";

/** Ported from reactbits.dev's Glare Hover (Animations). Pure CSS sweep, no dependencies. */
export interface GlareHoverProps {
  width?: string;
  height?: string;
  background?: string;
  borderRadius?: string;
  borderColor?: string;
  children?: ReactNode;
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  transitionDuration?: number;
  playOnce?: boolean;
  className?: string;
  style?: CSSProperties;
}

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (/^[0-9A-Fa-f]{3}$/.test(clean)) {
    const r = Number.parseInt(clean[0] + clean[0], 16);
    const g = Number.parseInt(clean[1] + clean[1], 16);
    const b = Number.parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return hex;
}

export default function GlareHover({
  width = "500px",
  height = "500px",
  background = "#000",
  borderRadius = "10px",
  borderColor = "#333",
  children,
  glareColor = "#ffffff",
  glareOpacity = 0.5,
  glareAngle = -45,
  glareSize = 250,
  transitionDuration = 650,
  playOnce = false,
  className = "",
  style = {},
}: GlareHoverProps) {
  const rgba = hexToRgba(glareColor, glareOpacity);

  const vars = {
    "--gh-width": width,
    "--gh-height": height,
    "--gh-bg": background,
    "--gh-br": borderRadius,
    "--gh-angle": `${glareAngle}deg`,
    "--gh-duration": `${transitionDuration}ms`,
    "--gh-size": `${glareSize}%`,
    "--gh-rgba": rgba,
    "--gh-border": borderColor,
  } as CSSProperties;

  return (
    <div
      className={`glare-hover ${playOnce ? "glare-hover--play-once" : ""} ${className}`}
      style={{ ...vars, ...style }}
    >
      {children}
    </div>
  );
}
