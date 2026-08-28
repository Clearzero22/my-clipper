import { CLIPS_KEY, type Clip } from "./types";

type Listener = (clips: Clip[]) => void;

/**
 * 封装 chrome.storage.local 的收藏读写。
 * 在非浏览器（测试）环境下用内存实现，保证可单测。
 */
export class ClipStore {
  private memory: Clip[] | null;
  private listeners = new Set<Listener>();

  constructor(memory?: Clip[]) {
    this.memory = memory ?? null;
  }

  private get backend(): "chrome" | "memory" {
    return this.memory !== null || typeof chrome === "undefined" || !chrome.storage
      ? "memory"
      : "chrome";
  }

  async list(): Promise<Clip[]> {
    if (this.backend === "memory") return [...(this.memory as Clip[])];
    const res = await chrome.storage.local.get(CLIPS_KEY);
    return (res[CLIPS_KEY] as Clip[]) ?? [];
  }

  async save(
    clip: { url: string; title: string; favicon?: string; selectionText?: string; note?: string; tags?: string[] } & Partial<Clip>
  ): Promise<Clip> {
    const clips = await this.list();
    const existing = clips.find((c) => c.url === clip.url);
    let result: Clip;
    if (existing) {
      // 去重：更新标签/笔记/标题，保留原 id 与 createdAt
      result = {
        ...existing,
        title: clip.title || existing.title,
        favicon: clip.favicon || existing.favicon,
        selectionText: clip.selectionText ?? existing.selectionText,
        note: clip.note ?? existing.note,
        tags: mergeTags(existing.tags, clip.tags),
      };
    } else {
      result = {
        id: clip.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: clip.createdAt ?? Date.now(),
        url: clip.url,
        title: clip.title,
        favicon: clip.favicon ?? "",
        selectionText: clip.selectionText,
        note: clip.note,
        tags: clip.tags ?? [],
      };
    }
    const next = existing
      ? clips.map((c) => (c.url === result.url ? result : c))
      : [...clips, result];
    await this.write(next);
    this.emit(next);
    return result;
  }

  async delete(id: string): Promise<void> {
    const clips = await this.list();
    const next = clips.filter((c) => c.id !== id);
    await this.write(next);
    this.emit(next);
  }

  async touch(id: string): Promise<void> {
    const clips = await this.list();
    const i = clips.findIndex((c) => c.id === id);
    if (i < 0) return;
    clips[i] = {
      ...clips[i],
      lastVisited: Date.now(),
      visitCount: (clips[i].visitCount ?? 0) + 1,
    };
    await this.write(clips);
    this.emit(clips);
  }

  async update(id: string, patch: Partial<Clip>): Promise<void> {
    const clips = await this.list();
    const next = clips.map((c) => (c.id === id ? { ...c, ...patch, tags: patch.tags ?? c.tags } : c));
    await this.write(next);
    this.emit(next);
  }

  async importClips(incoming: Clip[]): Promise<void> {
    const clips = await this.list();
    const byId = new Map(clips.map((c) => [c.id, c]));
    for (const c of incoming) byId.set(c.id, c);
    const next = [...byId.values()];
    await this.write(next);
    this.emit(next);
  }

  async clear(): Promise<void> {
    await this.write([]);
    this.emit([]);
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private async write(clips: Clip[]): Promise<void> {
    if (this.backend === "memory") {
      this.memory = clips;
      return;
    }
    try {
      await chrome.storage.local.set({ [CLIPS_KEY]: clips });
      if (chrome.runtime?.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // 配额满或写入失败：通知用户并重新抛出，由调用方决定是否提示
      if (typeof chrome !== "undefined" && chrome.notifications) {
        chrome.notifications.create("clip-error", {
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "保存失败",
          message: msg.includes("QUOTA") ? "存储空间已满，请导出备份后清理部分藏书。" : `写入失败：${msg}`,
        });
      }
      throw e;
    }
  }

  private emit(clips: Clip[]): void {
    for (const fn of this.listeners) fn(clips);
  }
}

export function mergeTags(a: string[], b?: string[]): string[] {
  if (!b) return a;
  const set = new Set(a);
  for (const t of b) if (t) set.add(t);
  return [...set];
}

export const clipStore = new ClipStore();
