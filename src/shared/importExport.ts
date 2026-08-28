import { isClip, type Clip } from "./types";

export const EXPORT_VERSION = 1;

export interface ExportPayload {
  version: number;
  exportedAt: string;
  count: number;
  clips: Clip[];
}

export function buildExportPayload(clips: Clip[]): ExportPayload {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    count: clips.length,
    clips,
  };
}

export function exportFileName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `藏书-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

/** Parse imported JSON — supports both legacy array and wrapped payload */
export function parseImportText(text: string): { clips: Clip[]; invalid: number; rawCount: number } {
  const data = JSON.parse(text);
  const arr: unknown[] = Array.isArray(data) ? data : Array.isArray((data as ExportPayload).clips) ? (data as ExportPayload).clips : [];
  if (arr.length === 0 && !Array.isArray(data) && !(data as ExportPayload).clips) {
    throw new Error("文件内容不是数组或带 clips 的导出包。");
  }
  const valid = arr.filter(isClip) as Clip[];
  return { clips: valid, invalid: arr.length - valid.length, rawCount: arr.length };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
