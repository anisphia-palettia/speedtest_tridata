"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Moon, Sun, Download, Upload, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import { Card }   from "@/components/ui/card";

import { measurePing, measureDownload, measureUpload } from "@/lib/speedtest/engine";
import { TEST_DURATION_MS }                             from "@/lib/speedtest/constants";
import type { Phase, TestResult }                      from "@/lib/speedtest/types";
import { cn }                                          from "@/lib/utils";

import PingCard      from "./PingCard";
import ResultSummary from "./ResultSummary";

const Speedometer = dynamic(() => import("./Speedometer"), { ssr: false });

// ── Phase timer — resets whenever phase changes so upload starts from 0 ───────
function usePhaseTimer(phase: Phase): number {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (phase !== "download" && phase !== "upload") return;
    startRef.current = performance.now();
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed(Math.min((performance.now() - startRef.current) / TEST_DURATION_MS, 1));
    }, 80);
    return () => clearInterval(id);
  }, [phase]);

  return (phase === "download" || phase === "upload") ? elapsed : 0;
}

// ── Theme toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun  className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

// ── Phase indicator bar ───────────────────────────────────────────────────────
function PhaseBar({ phase }: { phase: Phase }) {
  const steps: { key: Phase; label: string; icon: typeof Wifi }[] = [
    { key: "ping",     label: "Ping",     icon: Wifi },
    { key: "download", label: "Download", icon: Download },
    { key: "upload",   label: "Upload",   icon: Upload },
  ];

  const activeIdx = steps.findIndex((s) => s.key === phase);
  const isDone    = phase === "done";

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const Icon     = step.icon;
        const isActive = phase === step.key;
        const isPast   = isDone || (activeIdx > i && activeIdx !== -1);
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300",
              isActive && "bg-primary text-primary-foreground shadow-sm shadow-primary/30",
              isPast && !isActive && "bg-primary/15 text-primary",
              !isActive && !isPast && "bg-muted text-muted-foreground",
            )}>
              <Icon className="h-3 w-3" />
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "h-px w-4 transition-all duration-500",
                (isPast || isActive) ? "bg-primary/40" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SpeedTest() {
  const [phase,  setPhase]  = useState<Phase>("idle");
  const [speed,  setSpeed]  = useState(0);
  const [pingMs, setPingMs] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error,  setError]  = useState<string | null>(null);
  const abortRef            = useRef<AbortController | null>(null);

  const isTesting = phase === "download" || phase === "upload";
  const isRunning = phase === "ping" || isTesting;
  const progress  = usePhaseTimer(phase);
  const remainSec = Math.ceil(TEST_DURATION_MS / 1000 * (1 - progress));

  async function startTest() {
    if (isRunning) return;
    const ac = new AbortController();
    abortRef.current = ac;
    setResult(null); setError(null); setSpeed(0); setPingMs(0);

    try {
      setPhase("ping");
      const ping = await measurePing((ms) => setPingMs(ms), ac.signal);
      if (ac.signal.aborted) return;

      setPhase("download");
      setSpeed(0);
      const download = await measureDownload((mbps) => setSpeed(mbps), ac.signal);
      if (ac.signal.aborted) return;

      setPhase("upload");
      setSpeed(0);
      const upload = await measureUpload((mbps) => setSpeed(mbps), ac.signal);
      if (ac.signal.aborted) return;

      setPhase("done");
      setSpeed(0);
      setResult({ ping, download, upload });
    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setPhase("error");
        setSpeed(0);
      }
    } finally {
      // Reset to idle whenever cancel was pressed
      if (ac.signal.aborted) {
        setPhase("idle");
        setSpeed(0);
      }
      abortRef.current = null;
    }
  }

  function cancel() { abortRef.current?.abort(); }
  function reset()  {
    setPhase("idle"); setSpeed(0); setPingMs(0); setResult(null); setError(null);
  }

  const showPhaseBar = isRunning || phase === "done";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 select-none overflow-hidden">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] transition-all duration-700",
          phase === "download" ? "w-[500px] h-[500px] bg-red-500/8" :
          phase === "upload"   ? "w-[500px] h-[500px] bg-rose-500/8" :
          phase === "ping"     ? "w-[400px] h-[400px] bg-amber-500/6" :
          "w-[300px] h-[300px] bg-primary/5"
        )} />
      </div>

      {/* Top bar */}
      <header className="w-full max-w-md flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight">SpeedTest</h1>
          <p className="text-[11px] font-mono text-muted-foreground">Tridata</p>
        </div>
        <ThemeToggle />
      </header>

      {/* Error */}
      {error && (
        <Card className="mb-4 max-w-sm border-destructive/40 bg-destructive/10 px-5 py-3 text-sm text-destructive text-center">
          {error}
        </Card>
      )}

      {/* Phase indicator */}
      <div className="mb-4 h-8 flex items-center">
        {showPhaseBar
          ? <PhaseBar phase={phase} />
          : <span className="text-sm text-muted-foreground">Ready to test</span>
        }
      </div>

      {/* Speedometer */}
      <Speedometer value={speed} phase={phase} />

      {/* Linear progress bar — shown during download and upload */}
      <div className="w-full max-w-xs mt-1 mb-1 h-[3px] bg-muted rounded-full overflow-hidden">
        {isTesting && (
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: phase === "upload" ? "#f43f5e" : "#ef4444",
              transition: "width 0.15s linear",
            }}
          />
        )}
      </div>

      {/* Timer badge */}
      <div className="mb-5 h-7 flex items-center justify-center">
        {isTesting && (
          <Badge variant="secondary" className="font-mono text-xs tabular-nums px-3 py-1">
            {remainSec}s remaining
          </Badge>
        )}
        {phase === "done" && (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs px-3 py-1">
            Test complete
          </Badge>
        )}
      </div>

      {/* Ping — hidden once results are available */}
      {!result && <PingCard pingMs={pingMs} phase={phase} />}

      {/* Results */}
      {result && (
        <div className="mt-4 w-full max-w-sm">
          <ResultSummary result={result} />
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6 flex gap-3">
        {isRunning ? (
          <Button variant="outline" onClick={cancel} className="rounded-full px-8">
            Cancel
          </Button>
        ) : (
          <>
            <Button
              onClick={startTest}
              className="rounded-full px-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              {phase === "done" || phase === "error" ? "Test Again" : "Start Test"}
            </Button>
            {(phase === "done" || phase === "error") && (
              <Button variant="outline" onClick={reset} className="rounded-full px-8">
                Reset
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
