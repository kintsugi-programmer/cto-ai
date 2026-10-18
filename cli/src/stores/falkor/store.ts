import { CtoaiError, ErrorCodes } from "../../core/errors";
import type { CtoEdge, CtoNode, EdgeType } from "../../core/schema";
import { EdgeSchema, NodeSchema } from "../../core/schema";
import type { EdgeFilter, GraphSnapshot, KnowledgeStore } from "../../core/store";
import { encodeParam, type QueryResult, RespConnection, runQuery, runReadOnly } from "./client";

export interface FalkorStoreOptions {
  url: string;
  graph: string;
  username?: string;
  password?: string;
}

const NODE_LABEL = "Cto";

/**
 * FalkorDB store adapter (Phase 2).
 *
 * Nodes and edges map onto a single `Cto` label with `kind`/`rel` properties;
 * ids stay exactly as the file store writes them (`file:src/cli.ts`), so the
 * same queries work against either backend and schema-parity holds.
 */
export class FalkorStore implements KnowledgeStore {
  readonly kind = "falkordb";
  private connection: RespConnection | undefined;
  private readonly graph: string;

  constructor(private readonly options: FalkorStoreOptions) {
    this.graph = options.graph;
  }

  private async conn(): Promise<RespConnection> {
    if (this.connection === undefined) {
      this.connection = await RespConnection.open({
        url: this.options.url,
        username: this.options.username,
        password: this.options.password,
      });
      await this.ensureGraph();
    }
    return this.connection;
  }

  private async ensureGraph(): Promise<void> {
    const conn = this.connection;
    if (conn === undefined) {
      return;
    }
    // GRAPH.LIST tells us whether the graph exists; creating it is implicit
    // in the first write, but we create the id index up front so lookups by
    // id are fast from the first query.
    await runQuery(conn, this.graph, `CREATE INDEX ON :${NODE_LABEL}(id)`, undefined).catch(
      () => undefined,
    );
  }

  async load(): Promise<GraphSnapshot> {
    const conn = await this.conn();
    const nodes = new Map<string, CtoNode>();
    const edges = new Map<string, CtoEdge>();

    await paginate(
      conn,
      this.graph,
      `MATCH (n:${NODE_LABEL}) RETURN n.id, n.kind, n.name, n.props, n.createdAt, n.updatedAt`,
      (row) => {
        const [id, kind, name, props, createdAt, updatedAt] = row;
        if (typeof id !== "string" || typeof kind !== "string") {
          return;
        }
        const parsed = NodeSchema.safeParse({
          id,
          type: kind,
          name: typeof name === "string" ? name : id,
          properties: parseProps(props),
          createdAt: typeof createdAt === "string" ? createdAt : undefined,
          updatedAt: typeof updatedAt === "string" ? updatedAt : undefined,
        });
        if (parsed.success) {
          nodes.set(id, parsed.data);
        }
      },
    );

    await paginate(
      conn,
      this.graph,
      `MATCH (a:${NODE_LABEL})-[r]->(b:${NODE_LABEL}) RETURN a.id, b.id, r.rel, r.props`,
      (row) => {
        const [from, to, rel, props] = row;
        if (typeof from !== "string" || typeof to !== "string" || typeof rel !== "string") {
          return;
        }
        const parsed = EdgeSchema.safeParse({
          id: `${from}|${rel}|${to}`,
          type: rel,
          from,
          to,
          properties: parseProps(props),
        });
        if (parsed.success) {
          edges.set(parsed.data.id, parsed.data);
        }
      },
    );

    return { nodes: [...nodes.values()], edges: [...edges.values()] };
  }

  async replace(snapshot: GraphSnapshot): Promise<void> {
    const conn = await this.conn();
    // A rebuild replaces the whole project graph: delete first, then batch in.
    await runQuery(conn, this.graph, `MATCH (n:${NODE_LABEL}) DETACH DELETE n`);

    const nodeRows = snapshot.nodes.map((node) => ({
      id: node.id,
      kind: node.type,
      name: node.name,
      props: stringifyProps(node.properties),
      createdAt: node.createdAt ?? "",
      updatedAt: node.updatedAt ?? "",
    }));
    for (const batch of chunk(nodeRows, 500)) {
      await runQuery(
        conn,
        this.graph,
        `UNWIND $rows AS row CREATE (n:${NODE_LABEL}) SET n.id = row.id, n.kind = row.kind, n.name = row.name, n.props = row.props, n.createdAt = row.createdAt, n.updatedAt = row.updatedAt`,
        { rows: JSON.stringify(batch) },
      ).catch(async () => {
        // Older servers reject map/array parameters in some positions; fall
        // back to per-row MERGE with scalar parameters.
        for (const row of batch) {
          await runQuery(
            conn,
            this.graph,
            `MERGE (n:${NODE_LABEL} {id: $id}) SET n.kind = $kind, n.name = $name, n.props = $props, n.createdAt = $createdAt, n.updatedAt = $updatedAt`,
            row,
          );
        }
      });
    }

    const edgeRows = snapshot.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      rel: edge.type,
      props: stringifyProps(edge.properties),
    }));
    for (const batch of chunk(edgeRows, 500)) {
      for (const row of batch) {
        await runQuery(
          conn,
          this.graph,
          `MATCH (a:${NODE_LABEL} {id: $from}), (b:${NODE_LABEL} {id: $to}) MERGE (a)-[r {rel: $rel}]->(b) SET r.props = $props`,
          row,
        );
      }
    }
  }

  async getNode(id: string): Promise<CtoNode | undefined> {
    const conn = await this.conn();
    const result = await runReadOnly(
      conn,
      this.graph,
      `MATCH (n:${NODE_LABEL} {id: $id}) RETURN n.id, n.kind, n.name, n.props, n.createdAt, n.updatedAt`,
      { id },
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    const [nodeId, kind, name, props, createdAt, updatedAt] = row;
    if (typeof nodeId !== "string" || typeof kind !== "string") {
      return undefined;
    }
    const parsed = NodeSchema.safeParse({
      id: nodeId,
      type: kind,
      name: typeof name === "string" ? name : nodeId,
      properties: parseProps(props),
      createdAt: typeof createdAt === "string" ? createdAt : undefined,
      updatedAt: typeof updatedAt === "string" ? updatedAt : undefined,
    });
    return parsed.success ? parsed.data : undefined;
  }

  async edgesFor(nodeId: string, filter?: EdgeFilter): Promise<CtoEdge[]> {
    const conn = await this.conn();
    const result = await runReadOnly(
      conn,
      this.graph,
      `MATCH (a:${NODE_LABEL} {id: $id})-[r]->(b:${NODE_LABEL}) RETURN a.id, b.id, r.rel, r.props`,
      { id: nodeId },
    );
    const out: CtoEdge[] = [];
    for (const row of result.rows) {
      const [from, to, rel, props] = row;
      if (typeof from !== "string" || typeof to !== "string" || typeof rel !== "string") {
        continue;
      }
      if (filter?.type !== undefined && filter.type !== (rel as EdgeType)) {
        continue;
      }
      if (filter?.from !== undefined && filter.from !== from) {
        continue;
      }
      if (filter?.to !== undefined && filter.to !== to) {
        continue;
      }
      const parsed = EdgeSchema.safeParse({
        id: `${from}|${rel}|${to}`,
        type: rel,
        from,
        to,
        properties: parseProps(props),
      });
      if (parsed.success) {
        out.push(parsed.data);
      }
    }
    // Also include inbound edges when no direction filter is set.
    if (filter?.to === undefined) {
      const inbound = await runReadOnly(
        conn,
        this.graph,
        `MATCH (a:${NODE_LABEL})-[r]->(b:${NODE_LABEL} {id: $id}) RETURN a.id, b.id, r.rel, r.props`,
        { id: nodeId },
      );
      for (const row of inbound.rows) {
        const [from, to, rel, props] = row;
        if (typeof from !== "string" || typeof to !== "string" || typeof rel !== "string") {
          continue;
        }
        if (filter?.type !== undefined && filter.type !== (rel as EdgeType)) {
          continue;
        }
        if (filter?.from !== undefined && filter.from !== from) {
          continue;
        }
        const parsed = EdgeSchema.safeParse({
          id: `${from}|${rel}|${to}`,
          type: rel,
          from,
          to,
          properties: parseProps(props),
        });
        if (parsed.success && !out.some((edge) => edge.id === parsed.data.id)) {
          out.push(parsed.data);
        }
      }
    }
    return out.sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  async close(): Promise<void> {
    await this.connection?.close();
    this.connection = undefined;
  }
}

function parseProps(value: unknown): Record<string, unknown> {
  if (typeof value !== "string" || value.length === 0) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return {};
}

function stringifyProps(properties: Record<string, unknown>): string {
  return JSON.stringify(properties);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Page through a query using SKIP/LIMIT until fewer rows than the page come back. */
async function paginate(
  conn: RespConnection,
  graph: string,
  baseQuery: string,
  onRow: (row: unknown[]) => void,
  pageSize = 1000,
): Promise<void> {
  let skip = 0;
  for (;;) {
    const query = `${baseQuery} SKIP $skip LIMIT $limit`;
    let result: QueryResult;
    try {
      result = await runReadOnly(conn, graph, query, { skip, limit: pageSize });
    } catch (error) {
      if (error instanceof CtoaiError && error.code === ErrorCodes.CONNECTION_FAILED) {
        throw error;
      }
      // Servers that reject SKIP/LIMIT parameters fall back to one shot.
      result = await runQuery(conn, graph, baseQuery);
      for (const row of result.rows) {
        onRow(row);
      }
      return;
    }
    for (const row of result.rows) {
      onRow(row);
    }
    if (result.rows.length < pageSize) {
      return;
    }
    skip += pageSize;
  }
}

export { encodeParam };
