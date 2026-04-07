"use client";

import { useMemo } from "react";
import type { Phase } from "@/lib/speedtest/types";
import { MAX_MBPS } from "@/lib/speedtest/constants";

interface Props {
  value: number;
  phase?: Phase;
}

const W      = 420;
const H      = 360;   // taller so face circle is not clipped at top
const CX     = 210;
const CY     = 210;   // center moved down, bottom of circle clips cleanly behind SVG edge
const R      = 148;
const TW     = 16;
const START  = 225;
const SWEEP  = 270;

function toXY(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arc(r: number, a1: number, a2: number) {
  const s = toXY(r, a1);
  const e = toXY(r, a2);
  return `M${s.x.toFixed(1)},${s.y.toFixed(1)} A${r},${r} 0 ${(a2-a1)>180?1:0},1 ${e.x.toFixed(1)},${e.y.toFixed(1)}`;
}

// Minor tick every 50 Mbps, major every 200 Mbps
const TICK_N = 20;
const ticks  = Array.from({ length: TICK_N + 1 }, (_, i) => {
  const frac    = i / TICK_N;
  const angle   = START + frac * SWEEP;
  const isMajor = i % 4 === 0;
  const r1      = R + TW / 2 + 5;
  const r2      = r1 + (isMajor ? 14 : 7);
  return { p1: toXY(r1, angle), p2: toXY(r2, angle), isMajor };
});

const LABEL_VALS = [0, 200, 400, 600, 800, 1000];
const LABEL_R    = R + TW / 2 + 30;
const labelData  = LABEL_VALS.map((v) => ({
  v,
  pos: toXY(LABEL_R, START + (v / MAX_MBPS) * SWEEP),
}));

export default function Speedometer({ value, phase = "idle" }: Props) {
  const clamped  = Math.max(0, Math.min(value, MAX_MBPS));
  const progress = clamped / MAX_MBPS;
  const valAngle = START + progress * SWEEP;

  const isActive  = phase === "download" || phase === "upload";
  const showValue = phase !== "idle" && phase !== "done" && phase !== "error";

  const gradId   = phase === "upload" ? "gradUp" : "gradDl";
  const glowMain = phase === "upload" ? "#f43f5e" : "#ef4444";
  const glowSoft = phase === "upload" ? "#fb7185" : "#fca5a5";

  const displayVal = useMemo(() => {
    if (value >= 100) return value.toFixed(0);
    if (value >= 10)  return value.toFixed(1);
    return value.toFixed(2);
  }, [value]);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="hidden">
      <defs>
        <linearGradient id="gradDl" gradientUnits="userSpaceOnUse"
          x1={toXY(R, START).x}         y1={toXY(R, START).y}
          x2={toXY(R, START + SWEEP).x} y2={toXY(R, START + SWEEP).y}>
          <stop offset="0%"   stopColor="#f97316" />
          <stop offset="60%"  stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>

        <linearGradient id="gradUp" gradientUnits="userSpaceOnUse"
          x1={toXY(R, START).x}         y1={toXY(R, START).y}
          x2={toXY(R, START + SWEEP).x} y2={toXY(R, START + SWEEP).y}>
          <stop offset="0%"   stopColor="#fb923c" />
          <stop offset="60%"  stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>

        <filter id="arcGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <filter id="txtGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <radialGradient id="faceDark" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#3a1e1e" />
          <stop offset="100%" stopColor="#2a1212" />
        </radialGradient>

        <radialGradient id="faceLight" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#fff5f5" />
          <stop offset="100%" stopColor="#fef2f2" />
        </radialGradient>
      </defs>

      {/* Face — bottom half clips at SVG edge giving a clean Ookla-style cutoff */}
      <circle cx={CX} cy={CY} r={R + 52} className="fill-card" />
      <circle cx={CX} cy={CY} r={R + 52} fill="url(#faceDark)"
        opacity={0.45} className="dark:opacity-45 opacity-0" />
      <circle cx={CX} cy={CY} r={R + 52} fill="url(#faceLight)"
        opacity={0.4} className="dark:opacity-0 opacity-40" />

      {/* Ambient glow */}
      {isActive && progress > 0.01 && (
        <circle cx={CX} cy={CY} r={R - 2}
          fill="none" stroke={glowMain} strokeWidth={50} opacity={0.05} />
      )}

      {/* Track */}
      <path d={arc(R, START, START + SWEEP)}
        fill="none" className="stroke-muted" strokeWidth={TW} strokeLinecap="round" />

      {/* Value arc */}
      {progress > 0.002 && (
        <path d={arc(R, START, valAngle)}
          fill="none" stroke={`url(#${gradId})`}
          strokeWidth={TW} strokeLinecap="round"
          filter="url(#arcGlow)"
          style={{ transition: "d 0.2s linear" }}
        />
      )}

      {/* Ticks */}
      {ticks.map((t, i) => (
        <line key={i}
          x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y}
          className={t.isMajor ? "stroke-muted-foreground/40" : "stroke-muted-foreground/15"}
          strokeWidth={t.isMajor ? 2 : 1}
          strokeLinecap="round"
        />
      ))}

      {/* Labels */}
      {labelData.map((l) => (
        <text key={l.v}
          x={l.pos.x} y={l.pos.y}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={10}
          className="fill-muted-foreground/50"
          fontFamily="var(--font-geist-mono), monospace"
        >
          {l.v === 1000 ? "1k" : l.v}
        </text>
      ))}

      {/* Needle */}
      <g style={{
        transform: `rotate(${valAngle}deg)`,
        transformOrigin: `${CX}px ${CY}px`,
        transition: "transform 0.2s linear",
      }}>
        <line x1={CX} y1={CY + 8} x2={CX} y2={CY + 28}
          strokeWidth={7} strokeLinecap="round"
          className="stroke-muted-foreground/30" />
        <line x1={CX} y1={CY + 8} x2={CX} y2={CY - R + 24}
          stroke="white" strokeWidth={1.5} strokeLinecap="round" opacity={0.85} />
        {isActive && (
          <circle cx={CX} cy={CY - R + 24} r={3.5}
            fill={glowSoft} filter="url(#arcGlow)" />
        )}
      </g>

      {/* Hub */}
      <circle cx={CX} cy={CY} r={20} className="fill-card stroke-border" strokeWidth={2} />
      <circle cx={CX} cy={CY} r={9}
        fill={isActive ? glowMain : "currentColor"}
        className={isActive ? "" : "fill-muted-foreground/40"}
        style={{ transition: "fill 0.4s" }} />

      {/* Value text */}
      {showValue ? (
        <g filter={isActive ? "url(#txtGlow)" : undefined}>
          <text x={CX} y={CY + 48}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={52} fontWeight={700}
            className="fill-foreground"
            fontFamily="var(--font-geist-sans), system-ui"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}
          >
            {displayVal}
          </text>
          <text x={CX} y={CY + 78}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={11}
            fill={isActive ? glowSoft : undefined}
            className={isActive ? "" : "fill-muted-foreground"}
            fontFamily="var(--font-geist-mono), monospace"
            letterSpacing="0.18em"
            style={{ transition: "fill 0.4s" }}
          >
            Mbps
          </text>
        </g>
      ) : (
        <text x={CX} y={CY + 56}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={14} className="fill-muted-foreground/30"
          fontFamily="var(--font-geist-sans), system-ui">
          — — —
        </text>
      )}
    </svg>
  );
}
