import { describe, it, expect } from "vitest";
import { ClipStore, mergeTags } from "../src/shared/storage";
import type { Clip } from "../src/shared/types";

function makeClip(over: Partial<Clip> = {}): Clip {
  return {
    id: "1",
    url: "https://example.com",
    title: "Example",
    favicon: "",
    tags: [],
    createdAt: 1,
    ...over,
  };
}

describe("mergeTags", () => {
  it("dedupes and merges", () => {
    expect(mergeTags(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
  it("keeps original when no incoming", () => {
    expect(mergeTags(["a"], undefined)).toEqual(["a"]);
  });
});

describe("ClipStore (memory backend)", () => {
  it("saves and lists", async () => {
    const store = new ClipStore([]);
    const saved = await store.save({ url: "https://a.com", title: "A", tags: ["x"] });
    expect(saved.id).toBeTruthy();
    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0].url).toBe("https://a.com");
  });

  it("dedupes by url on save (updates tags)", async () => {
    const store = new ClipStore([]);
    await store.save({ url: "https://a.com", title: "A", tags: ["x"] });
    await store.save({ url: "https://a.com", title: "A2", tags: ["y"] });
    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0].tags).toEqual(["x", "y"]);
    expect(list[0].title).toBe("A2");
  });

  it("deletes by id", async () => {
    const store = new ClipStore([]);
    const saved = await store.save({ url: "https://a.com", title: "A" });
    await store.delete(saved.id);
    expect(await store.list()).toHaveLength(0);
  });

  it("imports with id dedupe", async () => {
    const store = new ClipStore([]);
    await store.save({ url: "https://a.com", title: "A" });
    await store.importClips([makeClip({ id: "1", url: "https://b.com", title: "B" })]);
    const list = await store.list();
    expect(list.map((c) => c.url).sort()).toEqual(["https://a.com", "https://b.com"]);
  });

  it("clears all", async () => {
    const store = new ClipStore([]);
    await store.save({ url: "https://a.com", title: "A" });
    await store.clear();
    expect(await store.list()).toHaveLength(0);
  });

  it("notifies listeners on change", async () => {
    const store = new ClipStore([]);
    let called = 0;
    store.onChange(() => called++);
    await store.save({ url: "https://a.com", title: "A" });
    expect(called).toBe(1);
  });
});
