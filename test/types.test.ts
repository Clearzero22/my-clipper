import { describe, it, expect } from "vitest";
import { isUrlLike, normalizeUrl, faviconFor, newId } from "../src/shared/types";

describe("types helpers", () => {
  it("isUrlLike detects http(s) urls", () => {
    expect(isUrlLike("https://example.com")).toBe(true);
    expect(isUrlLike("http://a.b.co/path")).toBe(true);
  });

  it("isUrlLike detects bare domains", () => {
    expect(isUrlLike("example.com")).toBe(true);
    expect(isUrlLike("sub.example.co.uk")).toBe(true);
  });

  it("isUrlLike rejects junk", () => {
    expect(isUrlLike("")).toBe(false);
    expect(isUrlLike("not a url")).toBe(false);
    expect(isUrlLike("hello")).toBe(false);
  });

  it("normalizeUrl adds https to bare domains", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("faviconFor extracts host", () => {
    expect(faviconFor("https://example.com/x")).toContain("example.com");
    expect(faviconFor("example.com")).toContain("example.com");
  });

  it("faviconFor returns empty on invalid", () => {
    expect(faviconFor("notaurl")).toBe("");
  });

  it("newId is unique-ish", () => {
    const a = newId();
    const b = newId();
    expect(a).not.toBe(b);
  });
});
