import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { type CtoEdge, type CtoNode, EdgeSchema, NodeSchema } from "../../core/schema";
import type { EdgeFilter, GraphSnapshot, KnowledgeStore } from "../../core/store";

async function readJsonl<T>(path: string, parse: (value: unknown) => T): Promise<T[]> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const items: T[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      items.push(parse(JSON.parse(trimmed)));
    }
  }
  return items;
}

function toJsonl(items: Array<{ id: string }>): string {
  const sorted = [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (sorted.length === 0) {
    return "";
  }
  return `${sorted.map((item) => JSON.stringify(item)).join("\n")}\n`;
}

/**
 * File-system store: a deterministic JSONL index under `.cto-ai/index/`.
 *
 * The index is derived data — it can always be rebuilt from the repository
 * and the append-only event log. Both files are sorted by id so identical
 * inputs always produce byte-identical output.
 */
export class FileStore implements KnowledgeStore {
  readonly kind = "file";

  constructor(readonly indexDir: string) {}

  private get nodesPath(): string {
    return join(this.indexDir, "nodes.jsonl");
  }

  private get edgesPath(): string {
    return join(this.indexDir, "edges.jsonl");
  }

  async load(): Promise<GraphSnapshot> {
    const [nodes, edges] = await Promise.all([
      readJsonl(this.nodesPath, (value) => NodeSchema.parse(value)),
      readJsonl(this.edgesPath, (value) => EdgeSchema.parse(value)),
    ]);
    return { nodes, edges };
  }

  async replace(snapshot: GraphSnapshot): Promise<void> {
    const nodes = snapshot.nodes.map((node) => NodeSchema.parse(node));
    const edges = snapshot.edges.map((edge) => EdgeSchema.parse(edge));
    await mkdir(this.indexDir, { recursive: true });
    await Promise.all([
      writeFile(this.nodesPath, toJsonl(nodes), "utf8"),
      writeFile(this.edgesPath, toJsonl(edges), "utf8"),
    ]);
  }

  async getNode(id: string): Promise<CtoNode | undefined> {
    const snapshot = await this.load();
    return snapshot.nodes.find((node) => node.id === id);
  }

  async edgesFor(nodeId: string, filter?: EdgeFilter): Promise<CtoEdge[]> {
    const snapshot = await this.load();
    return snapshot.edges.filter((edge) => {
      if (edge.from !== nodeId && edge.to !== nodeId) {
        return false;
      }
      if (filter?.from !== undefined && edge.from !== filter.from) {
        return false;
      }
      if (filter?.to !== undefined && edge.to !== filter.to) {
        return false;
      }
      if (filter?.type !== undefined && edge.type !== filter.type) {
        return false;
      }
      return true;
    });
  }

  async close(): Promise<void> {
    // Nothing to release for the file store.
  }
}
