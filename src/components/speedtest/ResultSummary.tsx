"use client";

import { Card } from "@/components/ui/card";
import type { TestResult } from "@/lib/speedtest/types";

interface Props {
  result: TestResult;
}

export default function ResultSummary({ result }: Props) {
  return (
    <Card className="w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-center py-3 border-b">
        Results
      </p>
      <div className="grid grid-cols-3 divide-x divide-border">
        <StatCol label="Ping"     value={result.ping.toFixed(0)}     unit="ms"   color="text-amber-500" />
        <StatCol label="Download" value={result.download.toFixed(1)} unit="Mbps" color="text-primary" />
        <StatCol label="Upload"   value={result.upload.toFixed(1)}   unit="Mbps" color="text-rose-500" />
      </div>
    </Card>
  );
}

function StatCol({ label, value, unit, color }: {
  label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className="flex flex-col items-center py-5 gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{unit}</span>
    </div>
  );
}
