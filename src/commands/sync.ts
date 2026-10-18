import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { CtoEdge, CtoNode } from "../core/schema";
import {
  buildIndex,
  type HealthReport,
  type IndexResult,
  sortEdges,
  sortNodes,
} from "../index/build";
import { collectGitInfo } from "../index/git";
import { openProject, requireInitialized } from "../project/open";

export interface SyncOptions {
  root: string;
  /** Rebuild from scratch instead of reusing the previous index. */
  full?: boolean;
  /** Skip git metadata collection (slightly faster, loses lastCommit*). */
  noGit?: boolean;
}

export interface SyncResult extends IndexResult {
  /** True when the emitted nodes/edges are byte-identical to the last run. */
  unchanged: boolean;
}

/** `ctoai sync` - incremental, hashed, deterministic index rebuild. */
export async function runSync(options: SyncOptions): Promise<SyncResult> {
  const { root } = options;
  const paths = requireInitialized(root);

  let previousHashes: Record<string, string> = {};
  let previous: { nodes: CtoNode[]; edges: CtoEdge[] } | undefined;
  if (!options.full) {
    previousHashes = await readHashes(paths.hashesPath);
    previous = await readSnapshot(paths.nodesPath, paths.edgesPath);
  }

  const git = options.noGit ? undefined : await collectGitInfo(root);

  const { config, events } = await openProject(root);
  const eventList = await events.all();

  const result = await buildIndex({
    root,
    config,
    events: eventList,
    git,
    previousHashes,
    previous,
  });

  // Byte-identical check: compare against what is on disk right now.
  const nodesText = serializeJsonl(result.nodes);
  const edgesText = serializeJsonl(result.edges);
  const [oldNodes, oldEdges] = await Promise.all([
    readText(paths.nodesPath),
    readText(paths.edgesPath),
  ]);
  const unchanged = nodesText === oldNodes && edgesText === oldEdges;

  if (!unchanged) {
    await mkdir(paths.index, { recursive: true });
    await Promise.all([
      writeFile(paths.nodesPath, nodesText, "utf8"),
      writeFile(paths.edgesPath, edgesText, "utf8"),
    ]);
  }
  await mkdir(paths.index, { recursive: true });
  await writeFile(paths.hashesPath, `${JSON.stringify(result.hashes, null, 2)}\n`, "utf8");
  await writeFile(paths.healthPath, `${JSON.stringify(result.health, null, 2)}\n`, "utf8");

  return { ...result, unchanged };
}

function serializeJsonl(items: Array<{ id: string }>): string {
  if (items.length === 0) {
    return "";
  }
  return `${items.map((item) => JSON.stringify(item)).join("\n")}\n`;
}

async function readText(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

async function readHashes(path: string): Promise<Record<string, string>> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // Missing or corrupt hashes: full rebuild.
  }
  return {};
}

async function readSnapshot(
  nodesPath: string,
  edgesPath: string,
): Promise<{ nodes: CtoNode[]; edges: CtoEdge[] } | undefined> {
  try {
    const [nodesRaw, edgesRaw] = await Promise.all([
      readFile(nodesPath, "utf8"),
      readFile(edgesPath, "utf8"),
    ]);
    return {
      nodes: sortNodes(parseJsonl(nodesRaw)),
      edges: sortEdges(parseJsonl(edgesRaw)),
    };
  } catch {
    return undefined;
  }
}

function parseJsonl<T>(raw: string): T[] {
  const out: T[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      out.push(JSON.parse(trimmed) as T);
    }
  }
  return out;
}

export type { HealthReport };
