import type { Clip } from "./types";
import { CLIPS_KEY } from "./types";

const SYNC_ENABLED_KEY = "syncEnabled";
const SYNC_CLIPS_KEY = "syncClips";

/**
 * 可选的 chrome.storage.sync 备份。
 * - 关闭时仅用 local
 * - 开启时：local 为主，sync 为备份；导入/合并时按 lastVisited/createdAt 取新者
 */
export async function isSyncEnabled(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.storage?.sync) return false;
  const res = await chrome.storage.sync.get(SYNC_ENABLED_KEY);
  return !!res[SYNC_ENABLED_KEY];
}

export async function setSyncEnabled(enabled: boolean): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.sync) return;
  await chrome.storage.sync.set({ [SYNC_ENABLED_KEY]: enabled });
  if (enabled) {
    // 首次开启：把 local 推到 sync
    const localRes = await chrome.storage.local.get(CLIPS_KEY);
    const clips = (localRes[CLIPS_KEY] as Clip[]) ?? [];
    await pushToSync(clips);
  }
}

export async function pushToSync(clips: Clip[]): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.sync) return;
  // sync 有配额（~100KB/项，8KB/key），超限则分片或截断
  try {
    await chrome.storage.sync.set({ [SYNC_CLIPS_KEY]: clips });
    if (chrome.runtime?.lastError) throw new Error(chrome.runtime.lastError.message);
  } catch (e) {
    console.warn("[sync] push failed:", e);
    throw e;
  }
}

export async function pullFromSync(): Promise<Clip[] | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.sync) return null;
  const res = await chrome.storage.sync.get(SYNC_CLIPS_KEY);
  return (res[SYNC_CLIPS_KEY] as Clip[]) ?? null;
}

/**
 * 合并策略：按 id，去重后取 lastVisited/createdAt 较新者；tags 合并去重
 */
export function mergeClips(local: Clip[], remote: Clip[]): Clip[] {
  const map = new Map<string, Clip>(local.map((c) => [c.id, c]));
  for (const r of remote) {
    const cur = map.get(r.id);
    if (!cur) {
      map.set(r.id, r);
      continue;
    }
    // 同 url 不同 id 的情况也按 url 去重
    const sameUrl = local.find((c) => c.url === r.url) || remote.find((c) => c.url === r.url);
    void sameUrl;
    const curTime = cur.lastVisited ?? cur.createdAt;
    const rTime = r.lastVisited ?? r.createdAt;
    if (rTime > curTime) {
      map.set(r.id, {
        ...cur,
        ...r,
        tags: [...new Set([...cur.tags, ...r.tags])],
      });
    } else {
      map.set(r.id, {
        ...cur,
        tags: [...new Set([...cur.tags, ...r.tags])],
      });
    }
  }
  // 按 url 去重（保留时间较新者）
  const byUrl = new Map<string, Clip>();
  for (const c of map.values()) {
    const prev = byUrl.get(c.url);
    if (!prev) byUrl.set(c.url, c);
    else {
      const prevTime = prev.lastVisited ?? prev.createdAt;
      const curTime = c.lastVisited ?? c.createdAt;
      if (curTime > prevTime) byUrl.set(c.url, c);
    }
  }
  return [...byUrl.values()];
}

export async function syncNow(): Promise<{ merged: number }> {
  const localRes = await chrome.storage.local.get(CLIPS_KEY);
  const local = (localRes[CLIPS_KEY] as Clip[]) ?? [];
  const remote = (await pullFromSync()) ?? [];
  const merged = mergeClips(local, remote);
  await chrome.storage.local.set({ [CLIPS_KEY]: merged });
  await pushToSync(merged);
  return { merged: merged.length };
}
