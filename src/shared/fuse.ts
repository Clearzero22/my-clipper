import Fuse from "fuse.js";
import type { Clip } from "./types";

let cachedClips: Clip[] | null = null;
let cachedFuse: Fuse<Clip> | null = null;

export function createFuse(clips: Clip[]): Fuse<Clip> {
  if (cachedClips === clips && cachedFuse) return cachedFuse;
  const fuse = new Fuse(clips, {
    keys: ["title", "url", "tags", "selectionText", "note"],
    threshold: 0.4,
    ignoreLocation: true,
  });
  cachedClips = clips;
  cachedFuse = fuse;
  return fuse;
}

export function searchClips(clips: Clip[], query: string): Clip[] {
  const q = query.trim();
  if (!q) return clips;
  return createFuse(clips).search(q).map((r) => r.item);
}

export function clearFuseCache(): void {
  cachedClips = null;
  cachedFuse = null;
}
