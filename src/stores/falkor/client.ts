import { connect as connectTcp, type Socket } from "node:net";
import { connect as connectTls } from "node:tls";

import { CtoaiError, ErrorCodes } from "../../core/errors";

/**
 * Minimal RESP2 client for FalkorDB.
 *
 * FalkorDB speaks the Redis wire protocol on port 6379, so the graph can be
 * driven with `GRAPH.QUERY` / `GRAPH.RO_QUERY` over a plain TCP (or TLS for
 * FalkorDB Cloud) connection - no client library needed. Only the handful of
 * reply types a graph query produces are implemented.
 */

export type RespValue =
  | { type: "simple"; value: string }
  | { type: "error"; value: string }
  | { type: "integer"; value: number }
  | { type: "bulk"; value: string | null }
  | { type: "array"; value: RespValue[] | null };

export interface FalkorConnectionOptions {
  url: string;
  password?: string;
  username?: string;
  timeoutMs?: number;
}

export interface QueryResult {
  /** Column names. */
  headers: string[];
  /** Rows, each row a list of decoded scalar values. */
  rows: unknown[][];
  statistics: Record<string, string>;
}

interface ParsedUrl {
  host: string;
  port: number;
  tls: boolean;
}

export function parseRedisUrl(url: string): ParsedUrl {
  const fallback: ParsedUrl = { host: "127.0.0.1", port: 6379, tls: false };
  if (url.trim().length === 0) {
    return fallback;
  }
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || fallback.host,
      port: parsed.port ? Number(parsed.port) : fallback.port,
      tls: parsed.protocol === "rediss:",
    };
  } catch {
    throw new CtoaiError(ErrorCodes.INVALID_ARGUMENT, `cannot parse FalkorDB URL: ${url}`);
  }
}

/**
 * A line-oriented RESP connection. Commands are queued so overlapping calls
 * never interleave on the wire.
 */
export class RespConnection {
  private socket: Socket | undefined;
  private buffer = Buffer.alloc(0);
  private queue: Array<{
    resolve: (value: RespValue) => void;
    reject: (error: Error) => void;
  }> = [];

  private constructor(socket: Socket) {
    this.socket = socket;
    socket.on("data", (chunk: Buffer) => this.onData(chunk));
    socket.on("error", (error: Error) => this.onEnd(error));
    socket.on("close", () => this.onEnd(new Error("connection closed")));
  }

  static async open(options: FalkorConnectionOptions): Promise<RespConnection> {
    const { host, port, tls } = parseRedisUrl(options.url);
    const timeoutMs = options.timeoutMs ?? 5000;

    const socket = await new Promise<Socket>((resolve, reject) => {
      const attempt = tls
        ? connectTls({ host, port, rejectUnauthorized: false })
        : connectTcp({ host, port });
      const timer = setTimeout(() => {
        attempt.destroy();
        reject(
          new CtoaiError(ErrorCodes.CONNECTION_FAILED, `timed out connecting to ${host}:${port}`),
        );
      }, timeoutMs);
      attempt.once(tls ? "secureConnect" : "connect", () => {
        clearTimeout(timer);
        resolve(attempt);
      });
      attempt.once("error", (error: Error) => {
        clearTimeout(timer);
        reject(
          new CtoaiError(
            ErrorCodes.CONNECTION_FAILED,
            `cannot reach FalkorDB at ${host}:${port}: ${error.message}`,
          ),
        );
      });
    });

    const connection = new RespConnection(socket);
    if (options.password !== undefined && options.password.length > 0) {
      const args =
        options.username !== undefined && options.username.length > 0
          ? ["AUTH", options.username, options.password]
          : ["AUTH", options.password];
      await connection.command(args);
    }
    return connection;
  }

  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    for (;;) {
      const parsed = this.readReply(this.buffer, 0);
      if (parsed === undefined) {
        return;
      }
      const waiter = this.queue.shift();
      if (waiter === undefined) {
        return;
      }
      this.buffer = this.buffer.subarray(parsed.offset);
      if (parsed.value.type === "error") {
        waiter.reject(new CtoaiError(ErrorCodes.CONNECTION_FAILED, parsed.value.value));
      } else {
        waiter.resolve(parsed.value);
      }
    }
  }

  private onEnd(error: Error): void {
    const pending = this.queue.splice(0);
    for (const waiter of pending) {
      waiter.reject(
        error instanceof CtoaiError
          ? error
          : new CtoaiError(ErrorCodes.CONNECTION_FAILED, error.message),
      );
    }
    this.socket = undefined;
  }

  /** Read one reply from `buffer` at `start`; undefined means "need more". */
  private readReply(
    buffer: Buffer,
    start: number,
  ): { value: RespValue; offset: number } | undefined {
    const newline = buffer.indexOf("\r\n", start);
    if (newline === -1) {
      return undefined;
    }
    const kind = buffer.subarray(start, start + 1).toString("utf8");
    const head = buffer.subarray(start + 1, newline).toString("utf8");
    const after = newline + 2;

    switch (kind) {
      case "+":
        return { value: { type: "simple", value: head }, offset: after };
      case "-":
        return { value: { type: "error", value: head }, offset: after };
      case ":": {
        const value = Number(head);
        if (!Number.isFinite(value)) {
          throw new CtoaiError(ErrorCodes.INTERNAL, `bad integer reply: ${head}`);
        }
        return { value: { type: "integer", value }, offset: after };
      }
      case "$": {
        const length = Number(head);
        if (length === -1) {
          return { value: { type: "bulk", value: null }, offset: after };
        }
        const end = after + length + 2;
        if (buffer.length < end) {
          return undefined;
        }
        return {
          value: { type: "bulk", value: buffer.subarray(after, after + length).toString("utf8") },
          offset: end,
        };
      }
      case "*": {
        const count = Number(head);
        if (count === -1) {
          return { value: { type: "array", value: null }, offset: after };
        }
        const items: RespValue[] = [];
        let cursor = after;
        for (let i = 0; i < count; i += 1) {
          const item = this.readReply(buffer, cursor);
          if (item === undefined) {
            return undefined;
          }
          items.push(item.value);
          cursor = item.offset;
        }
        return { value: { type: "array", value: items }, offset: cursor };
      }
      default:
        throw new CtoaiError(
          ErrorCodes.INTERNAL,
          `unexpected RESP type byte: ${JSON.stringify(kind)}`,
        );
    }
  }

  /** Send one command (array of strings) and await its reply. */
  async command(args: string[]): Promise<RespValue> {
    const socket = this.socket;
    if (socket === undefined) {
      throw new CtoaiError(ErrorCodes.CONNECTION_FAILED, "connection is closed");
    }
    const payload = encodeCommand(args);
    return new Promise<RespValue>((resolve, reject) => {
      this.queue.push({ resolve, reject });
      socket.write(payload, (error) => {
        if (error !== null && error !== undefined) {
          this.queue.shift();
          reject(new CtoaiError(ErrorCodes.CONNECTION_FAILED, error.message));
        }
      });
    });
  }

  async close(): Promise<void> {
    const socket = this.socket;
    this.socket = undefined;
    if (socket === undefined) {
      return;
    }
    await new Promise<void>((resolve) => {
      socket.end(() => resolve());
      socket.once("close", () => resolve());
    });
  }
}

/** Encode a command as a RESP array of bulk strings. */
export function encodeCommand(args: string[]): Buffer {
  const parts = [`*${args.length}\r\n`];
  for (const arg of args) {
    const bytes = Buffer.byteLength(arg, "utf8");
    parts.push(`$${bytes}\r\n${arg}\r\n`);
  }
  return Buffer.from(parts.join(""), "utf8");
}

/** Decode a RESP scalar (map keys/values, arrays) into plain JS values. */
export function decodeScalar(value: RespValue): unknown {
  switch (value.type) {
    case "simple":
    case "bulk":
      return value.value;
    case "integer":
      return value.value;
    case "array": {
      if (value.value === null) {
        return null;
      }
      return value.value.map((item) => decodeScalar(item));
    }
    case "error":
      return { error: value.value };
  }
}

/**
 * Run a Cypher query.
 *
 * FalkorDB returns a two-part result: a header row of column descriptors
 * followed by data rows, then a trailing statistics array. This flattens that
 * into `{ headers, rows, statistics }`.
 */
export async function runQuery(
  connection: RespConnection,
  graph: string,
  query: string,
  params?: Record<string, unknown>,
): Promise<QueryResult> {
  const args = ["GRAPH.QUERY", graph];
  if (params !== undefined && Object.keys(params).length > 0) {
    // Parameters travel as `CYPHER key=value ...` prefixes, which is how the
    // Redis protocol carries them without string interpolation.
    const encoded = Object.entries(params)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => `${key}=${encodeParam(value)}`)
      .join(" ");
    args.push(`CYPHER ${encoded}`);
  }
  args.push(query);

  const reply = await connection.command(args);
  return parseGraphReply(reply);
}

/** Read-only variant; falls back to GRAPH.QUERY where unsupported. */
export async function runReadOnly(
  connection: RespConnection,
  graph: string,
  query: string,
  params?: Record<string, unknown>,
): Promise<QueryResult> {
  const args = ["GRAPH.RO_QUERY", graph];
  if (params !== undefined && Object.keys(params).length > 0) {
    const encoded = Object.entries(params)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => `${key}=${encodeParam(value)}`)
      .join(" ");
    args.push(`CYPHER ${encoded}`);
  }
  args.push(query);
  const reply = await connection.command(args);
  if (reply.type === "error" && /unknown command/i.test(reply.value)) {
    return runQuery(connection, graph, query, params);
  }
  return parseGraphReply(reply);
}

/** Format a JS value as a Cypher literal for the CYPHER prefix. */
export function encodeParam(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  const text = String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `'${text}'`;
}

export function parseGraphReply(reply: RespValue): QueryResult {
  if (reply.type === "error") {
    throw new CtoaiError(ErrorCodes.CONNECTION_FAILED, reply.value);
  }
  if (reply.type !== "array" || reply.value === null) {
    throw new CtoaiError(ErrorCodes.INTERNAL, "unexpected reply from FalkorDB");
  }

  const parts = reply.value;
  const headers: string[] = [];
  const rows: unknown[][] = [];
  const statistics: Record<string, string> = {};

  if (parts.length === 0) {
    return { headers, rows, statistics };
  }

  const header = parts[0];
  if (header?.type === "array" && header.value !== null) {
    for (const column of header.value) {
      const decoded = decodeScalar(column);
      headers.push(Array.isArray(decoded) ? String(decoded[0] ?? "") : String(decoded));
    }
    for (const row of parts.slice(1)) {
      if (row?.type !== "array" || row.value === null) {
        continue;
      }
      if (row.value.length === 1 && row.value[0]?.type === "array") {
        // Statistics block.
        const stats = row.value[0].value ?? [];
        for (let i = 0; i + 1 < stats.length; i += 2) {
          const key = decodeScalar(stats[i] as RespValue);
          const value = decodeScalar(stats[i + 1] as RespValue);
          statistics[String(key)] = String(value);
        }
        continue;
      }
      rows.push(row.value.map((cell) => decodeCell(cell)));
    }
  }
  return { headers, rows, statistics };
}

/** Decode a cell, expanding FalkorDB node/relationship maps when present. */
function decodeCell(cell: RespValue): unknown {
  if (cell.type === "array" && cell.value !== null) {
    // A node arrives as [id, label, properties-map]; a relationship as
    // [id, type, srcId, dstId, properties-map]. Both are flat arrays whose
    // last element is a map of scalar pairs.
    const items = cell.value;
    const last = items[items.length - 1];
    if (last?.type === "array" && last.value !== null) {
      const map: Record<string, unknown> = {};
      for (let i = 0; i + 1 < last.value.length; i += 2) {
        const key = decodeScalar(last.value[i] as RespValue);
        map[String(key)] = decodeScalar(last.value[i + 1] as RespValue);
      }
      if (items.length >= 3) {
        return {
          id: decodeScalar(items[0] as RespValue),
          type: decodeScalar(items[1] as RespValue),
          properties: map,
        };
      }
    }
    return items.map((item) => decodeCell(item));
  }
  return decodeScalar(cell);
}
