export type Phase = "idle" | "ping" | "download" | "upload" | "done" | "error";

export interface TestResult {
  ping: number;
  download: number;
  upload: number;
}
