import { NextRequest } from "next/server";

const SERVER = process.env.NEXT_PUBLIC_SPEEDTEST_SERVER ?? "http://203.175.124.246:3000";

export async function POST(request: NextRequest) {
  const n = request.nextUrl.searchParams.get("n") ?? Math.random().toString();
  const upstream = await fetch(`${SERVER}/upload?n=${n}`, {
    method: "POST",
    body: request.body,
    headers: {
      "Content-Type": request.headers.get("Content-Type") ?? "application/octet-stream",
    },
    // @ts-expect-error — Node.js fetch requires this to stream the body without buffering
    duplex: "half",
    cache: "no-store",
  });

  return new Response(upstream.body, { status: upstream.status });
}
