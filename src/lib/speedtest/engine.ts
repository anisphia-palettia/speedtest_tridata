import { DOWNLOAD_URL, UPLOAD_URL, TEST_DURATION_MS, PARALLEL } from "./constants";

function ema(prev: number, next: number, alpha = 0.2) {
  return prev === 0 ? next : prev * (1 - alpha) + next * alpha;
}

// ── Ping: HEAD request ke /downloading ──────────────────────────────────────
export async function measurePing(
  onProgress: (ms: number) => void,
  signal: AbortSignal
): Promise<number> {
  const samples: number[] = [];

  for (let i = 0; i < 10; i++) {
    if (signal.aborted) break;
    try {
      const t0 = performance.now();
      await fetch(`${DOWNLOAD_URL}?n=${Math.random()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      samples.push(performance.now() - t0);
      onProgress(Math.min(...samples));
    } catch { /* skip */ }
    if (i < 9) await new Promise((r) => setTimeout(r, 100));
  }

  return samples.length > 0 ? Math.min(...samples) : 999;
}

// ── Download worker: loop terus hingga signal dibatalkan ──────────────────────
async function downloadWorker(idx: number, bytes: number[], signal: AbortSignal) {
  while (!signal.aborted) {
    try {
      const res = await fetch(`${DOWNLOAD_URL}?n=${Math.random()}`, {
        cache: "no-store",
        signal,
      });
      const reader = res.body!.getReader();
      while (!signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break; // file habis → mulai request baru
        bytes[idx] += value.length;
      }
    } catch {
      if (signal.aborted) return;
      await new Promise((r) => setTimeout(r, 50)); // singkat retry
    }
  }
}

export async function measureDownload(
  onProgress: (mbps: number) => void,
  signal: AbortSignal
): Promise<number> {
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), TEST_DURATION_MS);
  signal.addEventListener("abort", () => ac.abort());

  const bytes     = new Array<number>(PARALLEL).fill(0);
  const startTime = performance.now();
  let   smoothed  = 0;

  const tick = setInterval(() => {
    const total   = bytes.reduce((a, b) => a + b, 0);
    const elapsed = (performance.now() - startTime) / 1000;
    if (elapsed > 0.5 && total > 0) {
      const instant = (total * 8) / elapsed / 1_000_000;
      smoothed      = ema(smoothed, instant);
      onProgress(Math.min(smoothed, 10_000));
    }
  }, 250);

  try {
    await Promise.all(
      Array.from({ length: PARALLEL }, (_, i) => downloadWorker(i, bytes, ac.signal))
    );
  } finally {
    clearTimeout(tid);
    clearInterval(tick);
  }

  const total   = bytes.reduce((a, b) => a + b, 0);
  const elapsed = (performance.now() - startTime) / 1000;
  return elapsed > 0 ? (total * 8) / elapsed / 1_000_000 : 0;
}

// ── Upload worker: loop terus hingga signal dibatalkan ────────────────────────
function uploadWorker(
  idx: number,
  sent: number[],
  signal: AbortSignal
): Promise<void> {
  return new Promise((resolve) => {
    const CHUNK = 4 * 1024 * 1024; // 4 MB per request

    function sendChunk() {
      if (signal.aborted) { resolve(); return; }

      const data = new Uint8Array(CHUNK);
      crypto.getRandomValues(data.subarray(0, Math.min(CHUNK, 65536)));

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => { sent[idx] += e.loaded - (sent[idx] % CHUNK || 0); };
      xhr.onload = () => { sendChunk(); }; // mulai chunk berikutnya
      xhr.onerror = () => { if (!signal.aborted) sendChunk(); };
      xhr.ontimeout = () => { if (!signal.aborted) sendChunk(); };
      signal.addEventListener("abort", () => { xhr.abort(); resolve(); }, { once: true });

      xhr.open("POST", `${UPLOAD_URL}?n=${Math.random()}`);
      xhr.timeout = TEST_DURATION_MS + 5000;
      xhr.send(data.buffer);
    }

    sendChunk();
  });
}

export async function measureUpload(
  onProgress: (mbps: number) => void,
  signal: AbortSignal
): Promise<number> {
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), TEST_DURATION_MS);
  signal.addEventListener("abort", () => ac.abort());

  const sent      = new Array<number>(PARALLEL).fill(0);
  const startTime = performance.now();
  let   smoothed  = 0;

  const tick = setInterval(() => {
    const total   = sent.reduce((a, b) => a + b, 0);
    const elapsed = (performance.now() - startTime) / 1000;
    if (elapsed > 0.5 && total > 0) {
      const instant = (total * 8) / elapsed / 1_000_000;
      smoothed      = ema(smoothed, instant);
      onProgress(Math.min(smoothed, 10_000));
    }
  }, 250);

  try {
    await Promise.all(
      Array.from({ length: PARALLEL }, (_, i) => uploadWorker(i, sent, ac.signal))
    );
  } finally {
    clearTimeout(tid);
    clearInterval(tick);
  }

  const total   = sent.reduce((a, b) => a + b, 0);
  const elapsed = (performance.now() - startTime) / 1000;
  return elapsed > 0 ? (total * 8) / elapsed / 1_000_000 : 0;
}
