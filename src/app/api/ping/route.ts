import { NextResponse } from "next/server";
import https from "https";
import http from "http";

// LibreSpeed ping endpoint: GET /empty.php
const SERVER  = process.env.NEXT_PUBLIC_SPEEDTEST_SERVER ?? "";
const SAMPLES = 10;

function probe(): Promise<number> {
  return new Promise((resolve) => {
    const url  = new URL(`${SERVER}/backend/empty.php?r=${Math.random()}`);
    const mod  = url.protocol === "https:" ? https : http;
    const start = performance.now();

    const req = mod.request(
      {
        hostname: url.hostname,
        port:     Number(url.port) || (url.protocol === "https:" ? 443 : 80),
        path:     url.pathname + url.search,
        method:   "GET",
      },
      (res) => {
        res.resume();
        resolve(performance.now() - start);
      },
    );

    req.setTimeout(3000, () => { req.destroy(); resolve(9999); });
    req.on("error", () => resolve(9999));
    req.end();
  });
}

export async function GET() {
  const results: number[] = [];

  for (let i = 0; i < SAMPLES; i++) {
    const ms = await probe();
    if (ms < 9999) results.push(ms);
    if (i < SAMPLES - 1) await new Promise((r) => setTimeout(r, 100));
  }

  const min = results.length > 0 ? Math.min(...results) : 999;
  return NextResponse.json({ ms: min });
}
