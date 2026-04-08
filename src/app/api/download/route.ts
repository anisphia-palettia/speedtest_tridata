import { NextRequest } from "next/server";

const SERVER = process.env.NEXT_PUBLIC_SPEEDTEST_SERVER ?? "http://203.175.124.246:3000";

export async function GET(request: NextRequest) {
  const n = request.nextUrl.searchParams.get("n") ?? Math.random().toString();
  const upstream = await fetch(`${SERVER}/downloading?n=${n}`, {
    cache: "no-store",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
    },
  });
}
