"use client";

import type { Phase } from "@/lib/speedtest/types";

// Match Speedometer: W=420, H=320, CX=210, CY=185, R=148, face radius=R+52=200
const CX   = 210;
const CY   = 185;
const R    = 210;   // just outside the face
const CIRC = 2 * Math.PI * R;

interface Props {
  progress: number;
  phase: Phase;
}

export default function ProgressRing({ progress, phase }: Props) {
  const p      = Math.max(0, Math.min(progress, 1));
  const offset = CIRC * (1 - p);

  const color =
    phase === "download" ? "#ef4444" :
    phase === "upload"   ? "#f43f5e" :
    "transparent";

  const glow =
    phase === "download" ? "#fca5a5" :
    phase === "upload"   ? "#fda4af" :
    "transparent";

  if (p === 0 || color === "transparent") return null;

  // Leading dot position
  const dotAngle = -90 + p * 360;
  const dotRad   = (dotAngle * Math.PI) / 180;
  const dotX     = CX + R * Math.cos(dotRad);
  const dotY     = CY + R * Math.sin(dotRad);

  return (
    <svg
      className="absolute pointer-events-none"
      width={420}
      height={320}
      style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
    >
      <defs>
        <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Subtle track */}
      <circle cx={CX} cy={CY} r={R}
        fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.06} />

      {/* Glow layer */}
      <circle cx={CX} cy={CY} r={R}
        fill="none" stroke={glow} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={CIRC} strokeDashoffset={offset}
        opacity={0.15}
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ filter: "blur(5px)", transition: "stroke-dashoffset 0.15s linear" }}
      />

      {/* Main arc */}
      <circle cx={CX} cy={CY} r={R}
        fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={CIRC} strokeDashoffset={offset}
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ transition: "stroke-dashoffset 0.15s linear, stroke 0.4s" }}
      />

      {/* Leading dot */}
      <circle cx={dotX} cy={dotY} r={5}
        fill={color} filter="url(#dotGlow)"
        style={{ transition: "cx 0.15s linear, cy 0.15s linear" }}
      />
    </svg>
  );
}
