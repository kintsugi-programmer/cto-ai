import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";

/** Every path cto-ai owns inside one project. */
export interface CtoPaths {
  /** Project root (the folder containing .cto-ai/). */
  root: string;
  /** .cto-ai/ */
  base: string;
  context: string;
  specs: string;
  notes: string;
  skills: string;
  log: string;
  logSessions: string;
  logFindings: string;
  logDecisions: string;
  index: string;
  nodesPath: string;
  edgesPath: string;
  hashesPath: string;
  healthPath: string;
  configPath: string;
  readmePath: string;
}

/** The managed-block markers used in entry files. */
export const BLOCK_BEGIN = "<!-- cto-ai:begin -->";
export const BLOCK_END = "<!-- cto-ai:end -->";

/**
 * Resolve every cto-ai path from a project root.
 * `root` must be absolute; callers normalize with `resolveProjectRoot`.
 */
export function ctoPaths(root: string): CtoPaths {
  const base = join(root, ".cto-ai");
  const log = join(base, "log");
  return {
    root,
    base,
    context: join(base, "context"),
    specs: join(base, "specs"),
    notes: join(base, "notes"),
    skills: join(base, "skills"),
    log,
    logSessions: join(log, "sessions"),
    logFindings: join(log, "findings"),
    logDecisions: join(log, "decisions"),
    index: join(base, "index"),
    nodesPath: join(base, "index", "nodes.jsonl"),
    edgesPath: join(base, "index", "edges.jsonl"),
    hashesPath: join(base, "index", "hashes.json"),
    healthPath: join(base, "index", "health.json"),
    configPath: join(base, "config.json"),
    readmePath: join(base, "README.md"),
  };
}

/**
 * Walk up from `start` to find a folder that already contains `.cto-ai/`.
 * Falls back to `start` itself so `init` works on a fresh repo.
 */
export function resolveProjectRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, ".cto-ai"))) {
      return dir;
    }
    const parent = join(dir, "..");
    if (parent === dir) {
      return resolve(start);
    }
    dir = parent;
  }
}

/** Default project name: the root folder's name. */
export function defaultProjectName(root: string): string {
  return basename(resolve(root));
}
