"use client";

import type { Phase } from "@/lib/speedtest/types";
import { cn } from "@/lib/utils";

interface Props {
  pingMs: number;
  phase: Phase;
}

function quality(ms: number) {
  if (ms === 0) return { text: "—",        className: "text-muted-foreground" };
  if (ms < 10)  return { text: "Excellent", className: "text-emerald-500" };
  if (ms < 30)  return { text: "Good",      className: "text-green-500" };
  if (ms < 60)  return { text: "Fair",      className: "text-amber-500" };
  return              { text: "Poor",       className: "text-red-500" };
}

export default function PingCard({ pingMs, phase }: Props) {
  const q = quality(pingMs);

  return (
    <div className={cn(
      "inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm transition-all duration-300",
      phase === "ping"
        ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10"
        : "border-border bg-card"
    )}>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Ping</span>
      <span className="font-bold tabular-nums">
        {pingMs > 0 ? `${pingMs.toFixed(0)} ms` : "— ms"}
      </span>
      <span className="text-muted-foreground/40">·</span>
      <span className={cn("text-xs font-semibold", q.className)}>{q.text}</span>
    </div>
  );
}
