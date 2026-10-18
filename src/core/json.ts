/**
 * Deterministic JSON helpers.
 *
 * The determinism rule from the roadmap: any collection we emit is sorted,
 * and identical inputs always produce byte-identical output.
 */

/** Recursively sort object keys so serialization order is stable. */
export function sortKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeys(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      out[key] = sortKeys(source[key]);
    }
    return out as unknown as T;
  }
  return value;
}

/** Serialize with sorted keys and a trailing newline. */
export function stableStringify(value: unknown, pretty = true): string {
  const sorted = sortKeys(value);
  return `${JSON.stringify(sorted, null, pretty ? 2 : 0)}\n`;
}

/** Emit a value to stdout as stable JSON, or as pretty text when given. */
export function emit(json: boolean, value: unknown, human: () => string): void {
  if (json) {
    process.stdout.write(stableStringify(value));
    return;
  }
  process.stdout.write(`${human()}\n`);
}
