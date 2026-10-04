"use client";

import { motion } from "motion/react";

interface Node {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hub?: boolean;
}

interface Edge {
  from: string;
  to: string;
  label: string;
  delay: number;
}

const NODES: Node[] = [
  { id: "user", label: "User", sub: "wallet", x: 60, y: 40, w: 160, h: 64 },
  { id: "agent", label: "Agent", sub: "ERC-8004 identity", x: 980, y: 40, w: 180, h: 64 },

  { id: "intent", label: "IntentRegistry", sub: "EIP-712 intent", x: 60, y: 260, w: 200, h: 72 },
  { id: "router", label: "SettlementRouter", sub: "trust boundary", x: 470, y: 250, w: 220, h: 92, hub: true },
  { id: "fee", label: "FeeVault", sub: "x402-style pull fee", x: 960, y: 260, w: 200, h: 72 },

  { id: "stealth", label: "Stealth Output", sub: "ERC-5564 / 6538", x: 60, y: 480, w: 200, h: 72 },
  { id: "rep", label: "Reputation Entry", sub: "ERC-8004 adapter", x: 960, y: 480, w: 200, h: 72 },
];

const EDGES: Edge[] = [
  { from: "user", to: "intent", label: "1 · sign intent", delay: 0 },
  { from: "intent", to: "router", label: "2 · verify + submit", delay: 0.15 },
  { from: "agent", to: "router", label: "3 · settle()", delay: 0.3 },
  { from: "router", to: "stealth", label: "4 · private output", delay: 0.45 },
  { from: "router", to: "fee", label: "5 · pay fee (USDG)", delay: 0.6 },
  { from: "fee", to: "rep", label: "6 · receipt", delay: 0.75 },
];

const VIEW_W = 1200;
const VIEW_H = 620;

function anchor(node: Node, side: "left" | "right" | "top" | "bottom") {
  switch (side) {
    case "left":
      return { x: node.x, y: node.y + node.h / 2 };
    case "right":
      return { x: node.x + node.w, y: node.y + node.h / 2 };
    case "top":
      return { x: node.x + node.w / 2, y: node.y };
    case "bottom":
      return { x: node.x + node.w / 2, y: node.y + node.h };
  }
}

function edgePath(from: Node, to: Node): { d: string; mid: { x: number; y: number } } {
  const fromCenterX = from.x + from.w / 2;
  const toCenterX = to.x + to.w / 2;

  // Vertical-ish connection: exit bottom/top; horizontal-ish: exit left/right.
  const vertical = Math.abs(from.y - to.y) >= Math.abs(fromCenterX - toCenterX);

  const start = vertical
    ? anchor(from, to.y >= from.y ? "bottom" : "top")
    : anchor(from, toCenterX >= fromCenterX ? "right" : "left");
  const end = vertical
    ? anchor(to, to.y >= from.y ? "top" : "bottom")
    : anchor(to, toCenterX >= fromCenterX ? "left" : "right");

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  const d = vertical
    ? `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`
    : `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;

  return { d, mid: { x: midX, y: midY } };
}

/** Node-and-edge diagram of the real settlement flow, matching the deployed
 *  contracts by name. Edges draw themselves in on scroll, then a traveling
 *  dot loops along the settlement path to read as "live" rather than static. */
export function ArchitectureDiagram() {
  const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]));
  const routerNode = nodeById.router;

  return (
    <div className="relative mx-auto mt-16 hidden aspect-[1200/620] w-full max-w-5xl sm:block">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6e87ed" fillOpacity={0.8} />
          </marker>
        </defs>

        {EDGES.map((edge) => {
          const from = nodeById[edge.from];
          const to = nodeById[edge.to];
          const { d, mid } = edgePath(from, to);
          return (
            <g key={`${edge.from}-${edge.to}`}>
              <motion.path
                d={d}
                fill="none"
                stroke="#6e87ed"
                strokeOpacity={0.45}
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: edge.delay, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.text
                x={mid.x}
                y={mid.y - 8}
                textAnchor="middle"
                className="font-geist-mono"
                fontSize={13}
                fill="#8ea3f6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: edge.delay + 0.4 }}
              >
                {edge.label}
              </motion.text>
            </g>
          );
        })}

        {/* Traveling packet along the main settlement path: router -> stealth output */}
        <circle r={4} fill="#8ea3f6">
          <animateMotion
            dur="3.5s"
            repeatCount="indefinite"
            path={edgePath(routerNode, nodeById.stealth).d}
          />
        </circle>
      </svg>

      {NODES.map((node, i) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 * i, ease: "backOut" }}
          className={`absolute flex flex-col justify-center border px-4 py-3 backdrop-blur-xl ${
            node.hub
              ? "border-accent/50 bg-accent/10"
              : "border-white/10 bg-white/[0.03]"
          }`}
          style={{
            left: `${(node.x / VIEW_W) * 100}%`,
            top: `${(node.y / VIEW_H) * 100}%`,
            width: `${(node.w / VIEW_W) * 100}%`,
            height: `${(node.h / VIEW_H) * 100}%`,
          }}
        >
          <span className={`font-geist-mono text-sm ${node.hub ? "text-accent-light" : "text-white"}`}>
            {node.label}
          </span>
          <span className="mt-0.5 font-geist-mono text-[10px] tracking-wide text-neutral-500 uppercase">
            {node.sub}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
