import type { CtoEdge, CtoNode, EdgeType } from "./schema";

/** A full graph snapshot: all nodes and edges of one project. */
export interface GraphSnapshot {
  nodes: CtoNode[];
  edges: CtoEdge[];
}

/** Optional filter for edge lookups. */
export interface EdgeFilter {
  from?: string;
  to?: string;
  type?: EdgeType;
}

/**
 * The storage interface every backend implements.
 *
 * `FileStore` (JSONL under `.cto-ai/index/`) implements it now; a
 * `FalkorStore` (Cypher over FalkorDB) implements it in Phase 2. Tools only
 * ever talk to this interface, never to a concrete store.
 */
export interface KnowledgeStore {
  /** Human-readable store kind, e.g. "file" or "falkordb". */
  readonly kind: string;

  /** Load the full graph snapshot. */
  load(): Promise<GraphSnapshot>;

  /** Replace the whole snapshot (deterministic rebuild). */
  replace(snapshot: GraphSnapshot): Promise<void>;

  /** Fetch a single node by id. */
  getNode(id: string): Promise<CtoNode | undefined>;

  /** All edges touching a node, optionally filtered. */
  edgesFor(nodeId: string, filter?: EdgeFilter): Promise<CtoEdge[]>;

  /** Release any resources held by the store. */
  close(): Promise<void>;
}
