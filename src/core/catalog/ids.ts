export function normalizeId(id: string): string {
  return id.toLowerCase();
}

export function sameId(a: string, b: string): boolean {
  return normalizeId(a) === normalizeId(b);
}

export class IdMap<T> {
  private readonly entries = new Map<string, T>();

  get(id: string): T | undefined {
    return this.entries.get(normalizeId(id));
  }

  has(id: string): boolean {
    return this.entries.has(normalizeId(id));
  }

  set(id: string, value: T): this {
    this.entries.set(normalizeId(id), value);
    return this;
  }
}
