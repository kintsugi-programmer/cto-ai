import { CtoaiError, ErrorCodes } from "../core/errors";
import type { GraphSnapshot } from "../core/store";
import { loadConfig, openProject, saveConfig } from "../project/open";
import { parseRedisUrl, RespConnection } from "../stores/falkor/client";
import { FalkorStore } from "../stores/falkor/store";

export interface ConnectOptions {
  root: string;
  /** e.g. redis://localhost:6379 or rediss://... for FalkorDB Cloud. */
  url?: string;
  username?: string;
  /** Password comes from here, --password-stdin, or FALKORDB_PASSWORD. */
  password?: string;
  graph?: string;
  /** Run the backfill push after connecting. */
  backfill?: boolean;
}

export interface ConnectResult {
  url: string;
  graph: string;
  reachable: boolean;
  /** Server greeting / version string, when the ping succeeded. */
  version: string | null;
  backfilled: boolean;
  nodeCount: number;
  edgeCount: number;
}

/**
 * `ctoai connect` - FalkorDB onboarding.
 *
 * Signup itself cannot be automated; this validates what the user already
 * has: reach the endpoint, ping it, pick a graph, store the (non-secret) URL
 * in config, and optionally push the local index into the graph.
 *
 * Credentials never land in config.json - only `FALKORDB_URL` / `FALKORDB_USER`
 * / `FALKORDB_PASSWORD` env vars, or the process environment of this run.
 */
export async function runConnect(options: ConnectOptions): Promise<ConnectResult> {
  const { root } = options;
  const config = await loadConfig(root);

  const url = options.url ?? process.env.FALKORDB_URL ?? config.falkordb.url;
  if (url.trim().length === 0) {
    throw new CtoaiError(
      ErrorCodes.INVALID_ARGUMENT,
      "no FalkorDB URL given; pass --url, set FALKORDB_URL, or run `ctoai connect --url redis://localhost:6379`",
    );
  }
  // Validate the URL shape before opening a socket.
  parseRedisUrl(url);

  const username = options.username ?? process.env.FALKORDB_USER ?? config.falkordb.user;
  const password = options.password ?? process.env.FALKORDB_PASSWORD;
  const graph = options.graph ?? config.falkordb.graph ?? config.name ?? "ctoai";

  let connection: RespConnection | undefined;
  let version: string | null = null;
  let reachable = false;
  try {
    connection = await RespConnection.open({
      url,
      ...(username !== undefined && username.length > 0 ? { username } : {}),
      ...(password !== undefined && password.length > 0 ? { password } : {}),
      timeoutMs: 8000,
    });
    const pong = await connection.command(["PING"]);
    reachable = pong.type === "simple" && pong.value === "PONG";
    version = await serverVersion(connection);
  } catch (error) {
    if (error instanceof CtoaiError) {
      throw error;
    }
    throw new CtoaiError(ErrorCodes.CONNECTION_FAILED, String(error));
  } finally {
    await connection?.close();
  }

  // Persist only non-secret settings.
  config.backend = "falkordb";
  config.falkordb = { url, graph, user: username ?? "" };
  await saveConfig(root, config);

  let backfilled = false;
  let nodeCount = 0;
  let edgeCount = 0;
  if (options.backfill === true) {
    const push = await backfill(root, url, graph, username, password);
    backfilled = push.ok;
    nodeCount = push.nodeCount;
    edgeCount = push.edgeCount;
  }

  return { url, graph, reachable, version, backfilled, nodeCount, edgeCount };
}

async function serverVersion(connection: RespConnection): Promise<string | null> {
  try {
    const info = await connection.command(["INFO", "server"]);
    if (info.type === "bulk" && info.value !== null) {
      const match = /redis_version:(\S+)/.exec(info.value);
      if (match?.[1] !== undefined) {
        return match[1];
      }
      const falkor = /falkordb_version:(\S+)/.exec(info.value);
      if (falkor?.[1] !== undefined) {
        return falkor[1];
      }
    }
  } catch {
    // INFO may be disabled; version stays null.
  }
  return null;
}

/** Push the local file index into the connected graph. */
async function backfill(
  root: string,
  url: string,
  graph: string,
  username: string | undefined,
  password: string | undefined,
): Promise<{ ok: boolean; nodeCount: number; edgeCount: number; error?: string }> {
  const project = await openProject(root);
  let snapshot: GraphSnapshot;
  try {
    snapshot = await project.store.load();
  } finally {
    await project.store.close();
  }

  const target = new FalkorStore({
    url,
    graph,
    ...(username !== undefined && username.length > 0 ? { username } : {}),
    ...(password !== undefined && password.length > 0 ? { password } : {}),
  });
  try {
    await target.replace(snapshot);
    return { ok: true, nodeCount: snapshot.nodes.length, edgeCount: snapshot.edges.length };
  } catch (error) {
    return {
      ok: false,
      nodeCount: snapshot.nodes.length,
      edgeCount: snapshot.edges.length,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await target.close();
  }
}
