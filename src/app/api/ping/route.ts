import { NextResponse } from "next/server";
import http from "http";
import https from "https";

const TARGET = "http://10.1.2.153:3000";
const SAMPLES = 10;

function probe(): Promise<number> {
  return new Promise((resolve) => {
    const url = new URL(`${TARGET}/downloading?n=${Math.random()}`);
    const mod  = url.protocol === "https:" ? https : http;
    const start = performance.now();

    const req = mod.request(
      {
        hostname: url.hostname,
        port:     Number(url.port) || (url.protocol === "https:" ? 443 : 80),
        path:     url.pathname + url.search,
        method:   "HEAD",
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
