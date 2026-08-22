import { describe, it, expect } from "vitest";
import { searchClips } from "../src/shared/fuse";
import type { Clip } from "../src/shared/types";

function clip(url: string, title: string, tags: string[] = [], sel = ""): Clip {
  return { id: url, url, title, favicon: "", tags, selectionText: sel, createdAt: 1 };
}

describe("searchClips", () => {
  const clips = [
    clip("https://react.dev", "React Docs", ["frontend"]),
    clip("https://vuejs.org", "Vue Docs", ["frontend"]),
    clip("https://rust-lang.org", "Rust Lang", ["systems"], "memory safety"),
  ];

  it("returns all on empty query", () => {
    expect(searchClips(clips, "")).toHaveLength(3);
  });

  it("matches title", () => {
    const r = searchClips(clips, "react");
    expect(r.map((c) => c.url)).toEqual(["https://react.dev"]);
  });

  it("matches tag", () => {
    const r = searchClips(clips, "frontend");
    expect(r).toHaveLength(2);
  });

  it("matches selection text", () => {
    const r = searchClips(clips, "memory");
    expect(r.map((c) => c.url)).toEqual(["https://rust-lang.org"]);
  });

  it("fuzzy matches", () => {
    const r = searchClips(clips, "vve");
    expect(r.map((c) => c.url)).toContain("https://vuejs.org");
  });
});
