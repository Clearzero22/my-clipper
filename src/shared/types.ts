export interface Clip {
  id: string;
  url: string;
  title: string;
  favicon: string;
  selectionText?: string;
  note?: string;
  tags: string[];
  createdAt: number;
}

export const CLIPS_KEY = "clips";

export function isUrlLike(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  // 允许带协议的 URL，或 域名.域名 形式
  if (/^https?:\/\//i.test(v)) return true;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(v);
}

export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(v)) return `https://${v}`;
  return v;
}

export function faviconFor(url: string): string {
  try {
    const host = new URL(normalizeUrl(url)).host;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return "";
  }
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
