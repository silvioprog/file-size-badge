export class LRUCache<T> {
  private map = new Map<string, T>();

  constructor(private maxSize: number) {}

  get(key: string): T | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key) as T;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: string, value: T) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.maxSize) {
      this.map.delete(this.map.keys().next().value!);
    }
  }

  delete(key: string) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  get size() {
    return this.map.size;
  }
}

const registry: LRUCache<unknown>[] = [];

export const createCache = <T>(maxSize: number) => {
  const cache = new LRUCache<T>(maxSize);
  registry.push(cache as LRUCache<unknown>);
  return cache;
};

export const invalidateAll = (key: string) => {
  for (const cache of registry) cache.delete(key);
};

export const clearAll = () => {
  for (const cache of registry) cache.clear();
};
