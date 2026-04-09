export const SERVER           = process.env.NEXT_PUBLIC_SPEEDTEST_SERVER ?? "";
export const DOWNLOAD_URL     = `${SERVER}/backend/garbage.php`;
export const UPLOAD_URL       = `${SERVER}/backend/empty.php`;
export const PING_PATH        = "/backend/empty.php";
export const TEST_DURATION_MS = Number(process.env.NEXT_PUBLIC_TEST_DURATION_MS ?? 15_000);
export const PARALLEL         = Number(process.env.NEXT_PUBLIC_PARALLEL ?? 4);
export const MAX_MBPS         = Number(process.env.NEXT_PUBLIC_MAX_MBPS ?? 1000);
