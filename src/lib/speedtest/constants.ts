export const SERVER           = process.env.NEXT_PUBLIC_SPEEDTEST_SERVER ?? "http://203.175.124.246:3000";
export const DOWNLOAD_URL     = `${SERVER}/downloading`;
export const UPLOAD_URL       = `${SERVER}/upload`;
export const TEST_DURATION_MS = Number(process.env.NEXT_PUBLIC_TEST_DURATION_MS ?? 15_000);
export const PARALLEL         = Number(process.env.NEXT_PUBLIC_PARALLEL ?? 4);
export const MAX_MBPS         = Number(process.env.NEXT_PUBLIC_MAX_MBPS ?? 1000);
