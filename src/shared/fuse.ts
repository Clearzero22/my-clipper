import Fuse from "fuse.js";
import type { Clip } from "./types";

export function createFuse(clips: Clip[]): Fuse<Clip> {
  return new Fuse(clips, {
    keys: ["title", "url", "tags", "selectionText", "note"],
    threshold: 0.4,
    ignoreLocation: true,
  });
}

export function searchClips(clips: Clip[], query: string): Clip[] {
  const q = query.trim();
  if (!q) return clips;
  return createFuse(clips).search(q).map((r) => r.item);
}
