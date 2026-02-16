import { LRUCache, createCache, invalidateAll, clearAll } from "./cache";

describe("LRUCache", () => {
  it("should store and retrieve values", () => {
    const cache = new LRUCache<number>(10);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("should return undefined for missing keys", () => {
    const cache = new LRUCache<number>(10);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("should evict oldest entry when exceeding max size", () => {
    const cache = new LRUCache<number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.set("d", 4);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.size).toBe(3);
  });

  it("should promote accessed entries to most recent", () => {
    const cache = new LRUCache<number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.get("a"); // promote "a"
    cache.set("d", 4); // evicts "b" (oldest after "a" was promoted)
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
  });

  it("should delete entries", () => {
    const cache = new LRUCache<number>(10);
    cache.set("a", 1);
    cache.delete("a");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("should clear all entries", () => {
    const cache = new LRUCache<number>(10);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("should handle null values without confusing with cache miss", () => {
    const cache = new LRUCache<number | null>(10);
    cache.set("a", null);
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBeUndefined();
  });

  it("should update value for existing key", () => {
    const cache = new LRUCache<number>(10);
    cache.set("a", 1);
    cache.set("a", 2);
    expect(cache.get("a")).toBe(2);
    expect(cache.size).toBe(1);
  });
});

describe("cache registry", () => {
  it("should invalidate a key across all registered caches", () => {
    const cache1 = createCache<number>(10);
    const cache2 = createCache<string>(10);
    cache1.set("key", 42);
    cache2.set("key", "hello");

    invalidateAll("key");

    expect(cache1.get("key")).toBeUndefined();
    expect(cache2.get("key")).toBeUndefined();
  });

  it("should clear all registered caches", () => {
    const cache1 = createCache<number>(10);
    const cache2 = createCache<string>(10);
    cache1.set("a", 1);
    cache2.set("b", "x");

    clearAll();

    expect(cache1.size).toBe(0);
    expect(cache2.size).toBe(0);
  });
});
