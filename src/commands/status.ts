import { readFile, stat } from "node:fs/promises";

import type { HealthReport } from "../index/build";
import { openProject, requireInitialized } from "../project/open";

export interface StatusOptions {
  root: string;
}

export interface StatusResult {
  project: string;
  backend: string;
  nodes: number;
  edges: number;
  byType: Record<string, number>;
  health: HealthReport;
  /** ISO timestamp of the last successful sync, or null. */
  syncedAt: string | null;
  /** True when the index has never been built. */
  empty: boolean;
}

/** `ctoai status` - context coverage and health at a glance. */
export async function runStatus(options: StatusOptions): Promise<StatusResult> {
  const { root } = options;
  requireInitialized(root);
  const { paths, config, store } = await openProject(root);
  try {
    const snapshot = await store.load();
    const byType: Record<string, number> = {};
    for (const node of snapshot.nodes) {
      byType[node.type] = (byType[node.type] ?? 0) + 1;
    }
    const health = await readHealth(paths.healthPath);
    return {
      project: config.name,
      backend: config.backend,
      nodes: snapshot.nodes.length,
      edges: snapshot.edges.length,
      byType: sortRecord(byType),
      health,
      syncedAt: await mtimeIso(paths.nodesPath),
      empty: snapshot.nodes.length === 0,
    };
  } finally {
    await store.close();
  }
}

async function readHealth(path: string): Promise<HealthReport> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as HealthReport;
  } catch {
    return { coverage: 0, stale: 0, openItems: 0, files: 0, filesWithEdges: 0, staleFiles: 0 };
  }
}

async function mtimeIso(path: string): Promise<string | null> {
  try {
    const info = await stat(path);
    return info.mtime.toISOString();
  } catch {
    return null;
  }
}

function sortRecord(record: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(record).sort()) {
    out[key] = record[key] as number;
  }
  return out;
}
