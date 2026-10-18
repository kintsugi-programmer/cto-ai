import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { CtoEdge, CtoNode } from "../src/core/schema";
import { FileStore } from "../src/stores/file/store";

const cleanupDirs: string[] = [];

async function createStore(): Promise<FileStore> {
  const dir = await mkdtemp(join(tmpdir(), "ctoai-test-"));
  cleanupDirs.push(dir);
  return new FileStore(join(dir, "index"));
}

afterEach(async () => {
  await Promise.all(cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

const nodes: CtoNode[] = [
  { id: "file:src/b.ts", type: "File", name: "b.ts", properties: {} },
  { id: "file:src/a.ts", type: "File", name: "a.ts", properties: {} },
];

const edges: CtoEdge[] = [
  { id: "e2", type: "DEPENDS_ON", from: "file:src/a.ts", to: "file:src/b.ts", properties: {} },
  { id: "e1", type: "CONTAINS", from: "dir:src", to: "file:src/a.ts", properties: {} },
];

describe("FileStore", () => {
  it("returns an empty snapshot when nothing is written yet", async () => {
    const store = await createStore();
    await expect(store.load()).resolves.toEqual({ nodes: [], edges: [] });
  });

  it("roundtrips nodes and edges in deterministic (sorted) order", async () => {
    const store = await createStore();
    await store.replace({ nodes, edges });

    const loaded = await store.load();
    expect(loaded.nodes.map((node) => node.id)).toEqual(["file:src/a.ts", "file:src/b.ts"]);
    expect(loaded.edges.map((edge) => edge.id)).toEqual(["e1", "e2"]);

    await expect(store.getNode("file:src/a.ts")).resolves.toMatchObject({ name: "a.ts" });
    await expect(store.edgesFor("file:src/a.ts")).resolves.toHaveLength(2);
    await expect(store.edgesFor("file:src/a.ts", { type: "DEPENDS_ON" })).resolves.toHaveLength(1);
  });

  it("writes byte-identical files across runs (idempotent)", async () => {
    const store = await createStore();
    await store.replace({ nodes, edges });
    const firstNodes = await readFile(join(store.indexDir, "nodes.jsonl"), "utf8");
    const firstEdges = await readFile(join(store.indexDir, "edges.jsonl"), "utf8");

    const roundtripped = await store.load();
    await store.replace(roundtripped);

    const secondNodes = await readFile(join(store.indexDir, "nodes.jsonl"), "utf8");
    const secondEdges = await readFile(join(store.indexDir, "edges.jsonl"), "utf8");
    expect(secondNodes).toBe(firstNodes);
    expect(secondEdges).toBe(firstEdges);
  });

  it("rejects unknown node types", async () => {
    const store = await createStore();
    await expect(
      store.replace({
        nodes: [{ id: "x", type: "Unicorn" as never, name: "x", properties: {} }],
        edges: [],
      }),
    ).rejects.toThrow();
  });
});
