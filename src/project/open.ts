import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { type Config, ConfigSchema } from "../core/config";
import { CtoaiError, ErrorCodes } from "../core/errors";
import { type EventLog, FileEventLog } from "../core/events";
import { type CtoPaths, ctoPaths, defaultProjectName } from "../core/paths";
import type { KnowledgeStore } from "../core/store";
import { FalkorStore } from "../stores/falkor/store";
import { FileStore } from "../stores/file/store";

export interface LoadedProject {
  root: string;
  paths: CtoPaths;
  config: Config;
  store: KnowledgeStore;
  events: EventLog;
}

/** Read and validate `.cto-ai/config.json`; missing file yields defaults. */
export async function loadConfig(root: string): Promise<Config> {
  const paths = ctoPaths(root);
  let raw: string;
  try {
    raw = await readFile(paths.configPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return ConfigSchema.parse({ name: defaultProjectName(root) });
    }
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CtoaiError(
      ErrorCodes.INTERNAL,
      `.cto-ai/config.json is not valid JSON; fix it or re-run \`ctoai init\``,
    );
  }
  return ConfigSchema.parse(parsed);
}

export async function saveConfig(root: string, config: Config): Promise<void> {
  const paths = ctoPaths(root);
  await mkdir(paths.base, { recursive: true });
  await writeFile(paths.configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

/** Ensure `.cto-ai/` exists; error when the project was never initialized. */
export function requireInitialized(root: string): CtoPaths {
  const paths = ctoPaths(root);
  if (!existsSync(paths.base)) {
    throw new CtoaiError(
      ErrorCodes.NOT_INITIALIZED,
      `no .cto-ai/ in ${root}; run \`ctoai init\` first`,
    );
  }
  return paths;
}

/**
 * Open the project: config, store (per `backend`), and event log.
 *
 * Secrets never come from config.json - FalkorDB credentials arrive via
 * `FALKORDB_URL` / `FALKORDB_USER` / `FALKORDB_PASSWORD`.
 */
export async function openProject(root: string): Promise<LoadedProject> {
  const paths = requireInitialized(root);
  const config = await loadConfig(root);

  let store: KnowledgeStore;
  if (config.backend === "falkordb") {
    const url = process.env.FALKORDB_URL ?? config.falkordb.url;
    if (url.length === 0) {
      throw new CtoaiError(
        ErrorCodes.CONNECTION_FAILED,
        "backend is falkordb but no URL is configured; set FALKORDB_URL or run `ctoai connect`",
      );
    }
    store = new FalkorStore({
      url,
      graph: config.falkordb.graph || config.name || "ctoai",
      username: process.env.FALKORDB_USER ?? config.falkordb.user,
      password: process.env.FALKORDB_PASSWORD,
    });
  } else {
    store = new FileStore(paths.index);
  }

  return { root, paths, config, store, events: new FileEventLog(paths.log) };
}
