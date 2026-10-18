import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Config } from "../core/config";
import type { CtoEvent } from "../core/events";
import { type CtoPaths, ctoPaths } from "../core/paths";
import type { CtoEdge, CtoNode } from "../core/schema";
import { resolveImport, scanImports } from "../scan/imports";
import { resolveMarkdownLink, scanMarkdownLinks, splitFrontmatter } from "../scan/markdown";
import { directoriesOf, type ScannedFile, walkFiles } from "../scan/walk";

/** Everything one `sync` run produced. */
export interface IndexResult {
  nodes: CtoNode[];
  edges: CtoEdge[];
  /** path -> sha256, the incremental driver for the next run. */
  hashes: Record<string, string>;
  health: HealthReport;
  stats: IndexStats;
}

export interface IndexStats {
  files: number;
  dirs: number;
  nodes: number;
  edges: number;
  /** Files whose content changed (or are new) compared to the last index. */
  changed: number;
  /** Files reused from the previous index without re-parsing. */
  reused: number;
  skipped: number;
}

export interface HealthReport {
  /** % of File nodes that have at least one edge. */
  coverage: number;
  /** % of File nodes untouched for more than 30 days (git). */
  stale: number;
  /** Unchecked checkboxes in context/ and specs/. */
  openItems: number;
  files: number;
  filesWithEdges: number;
  staleFiles: number;
}

/** Minimal git metadata we attach to file nodes. */
export interface GitInfo {
  /** path -> commit sha */
  commit: Map<string, string>;
  /** path -> ISO date */
  date: Map<string, string>;
}

const CODE_LANGUAGES = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "mts",
  "cts",
  "py",
  "go",
  "rs",
]);

function nowIso(): string {
  return new Date().toISOString();
}

/** Deterministic edge id. */
function edgeId(type: string, from: string, to: string): string {
  return `${from}|${type}|${to}`;
}

function addEdge(
  edges: Map<string, CtoEdge>,
  type: CtoEdge["type"],
  from: string,
  to: string,
  properties: Record<string, unknown> = {},
): void {
  if (from === to) {
    return;
  }
  const id = edgeId(type, from, to);
  if (edges.has(id)) {
    return;
  }
  edges.set(id, { id, type, from, to, properties: { source: "index", ...properties } });
}

/** Frontmatter of a note/spec file, loosely typed. */
type Frontmatter = Record<string, unknown>;

function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  const [fm, body] = splitFrontmatter(raw);
  if (fm.trim().length === 0) {
    return { frontmatter: {}, body };
  }
  const out: Frontmatter = {};
  let currentKey = "";
  for (const line of fm.split("\n")) {
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem?.[1] !== undefined && currentKey !== "") {
      const existing = out[currentKey];
      if (Array.isArray(existing)) {
        existing.push(listItem[1].trim());
      }
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (kv?.[1] !== undefined) {
      currentKey = kv[1];
      const value = (kv[2] ?? "").trim();
      if (value === "") {
        out[currentKey] = [];
      } else if (value.startsWith("[") && value.endsWith("]")) {
        out[currentKey] = value
          .slice(1, -1)
          .split(",")
          .map((item) => item.trim().replace(/^["']|["']$/g, ""))
          .filter((item) => item.length > 0);
      } else {
        out[currentKey] = value.replace(/^["']|["']$/g, "");
      }
    }
  }
  return { frontmatter: out, body };
}

/** GFM checkboxes: `[ ]` open, `[x]`/`[X]` done. */
export function scanCheckboxes(body: string): Array<{ text: string; done: boolean; line: number }> {
  const out: Array<{ text: string; done: boolean; line: number }> = [];
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) {
      continue;
    }
    const match = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) {
      out.push({ text: match[2].trim(), done: match[1] !== " ", line: i + 1 });
    }
  }
  return out;
}

export interface BuildOptions {
  root: string;
  config: Config;
  events?: CtoEvent[];
  git?: GitInfo;
  /** Previous hashes, for incremental reuse. */
  previousHashes?: Record<string, string>;
  /** Previous snapshot, for incremental reuse. */
  previous?: { nodes: CtoNode[]; edges: CtoEdge[] };
  now?: string;
}

/**
 * Build the project graph from the repository.
 *
 * Incremental: files whose sha256 is unchanged reuse their previously
 * extracted nodes and edges verbatim. Output is fully sorted, so two runs on
 * an unchanged tree are byte-identical.
 */
export async function buildIndex(options: BuildOptions): Promise<IndexResult> {
  const { root, config } = options;
  const now = options.now ?? nowIso();
  const paths: CtoPaths = ctoPaths(root);
  const previousHashes = options.previousHashes ?? {};
  const previousByKey = indexPrevious(options.previous);
  // Timestamps must not churn: an unchanged node keeps the ones it had, so
  // two consecutive syncs of an unchanged tree are byte-identical.
  const previousById = new Map<string, CtoNode>(
    (options.previous?.nodes ?? []).map((node) => [node.id, node]),
  );
  const stamps = (id: string): { createdAt: string; updatedAt: string } => {
    const prev = previousById.get(id);
    return {
      createdAt: prev?.createdAt ?? now,
      updatedAt: prev?.updatedAt ?? now,
    };
  };

  const files = await walkFiles(root, { ignore: config.ignore });
  const textByPath = new Map<string, ScannedFile>();
  for (const file of files) {
    if (file.text) {
      textByPath.set(file.path, file);
    }
  }
  const knownPaths = new Set(files.map((file) => file.path));

  const nodes = new Map<string, CtoNode>();
  const edges = new Map<string, CtoEdge>();
  const hashes: Record<string, string> = {};
  let changed = 0;
  let reused = 0;
  let skipped = 0;

  // ---- File and Dir nodes --------------------------------------------------
  const dirs = directoriesOf(files);
  const dirId = (dir: string): string => (dir === "" ? "dir:." : `dir:${dir}`);

  for (const dir of dirs) {
    const id = dirId(dir);
    nodes.set(id, {
      id,
      type: "Dir",
      name: dir === "" ? "." : (dir.split("/").pop() ?? dir),
      properties: { path: dir, source: "index" },
      ...stamps(id),
    });
    if (dir !== "") {
      const parent = dir.includes("/") ? dir.slice(0, dir.lastIndexOf("/")) : "";
      addEdge(edges, "CONTAINS", dirId(parent), id);
    } else {
      addEdge(edges, "CONTAINS", `project:${config.name || "project"}`, id);
    }
  }

  for (const file of files) {
    hashes[file.path] = file.hash;
    const prev = previousHashes[file.path];
    const reusedEntry = prev === file.hash ? previousByKey.files.get(file.path) : undefined;

    const node: CtoNode = {
      id: file.id,
      type: "File",
      name: file.name,
      properties: { path: file.path, ext: file.ext, size: file.size, source: "index" },
      ...stamps(file.id),
    };
    const gitCommit = options.git?.commit.get(file.path);
    const gitDate = options.git?.date.get(file.path);
    if (gitCommit !== undefined) {
      node.properties.lastCommit = gitCommit;
    }
    if (gitDate !== undefined) {
      node.properties.lastCommitAt = gitDate;
    }
    if (reusedEntry !== undefined) {
      // Reuse the previous node wholesale except for derived git properties,
      // which are cheap and may have advanced without a content change.
      nodes.set(file.id, {
        ...reusedEntry.node,
        ...node,
        properties: {
          ...reusedEntry.node.properties,
          ...node.properties,
        },
      });
      // CONTAINS is derived from the file path, not the content, so it is
      // re-emitted on every path (indexPrevious skips it).
      const parentDir = file.path.includes("/")
        ? file.path.slice(0, file.path.lastIndexOf("/"))
        : "";
      addEdge(edges, "CONTAINS", dirId(parentDir), file.id);
      for (const edge of reusedEntry.edges) {
        edges.set(edge.id, edge);
      }
      reused += 1;
      continue;
    }

    changed += 1;
    nodes.set(file.id, node);
    const parentDir = file.path.includes("/") ? file.path.slice(0, file.path.lastIndexOf("/")) : "";
    addEdge(edges, "CONTAINS", dirId(parentDir), file.id);

    // Non-text files contribute nothing beyond their node.
    if (!file.text) {
      skipped += 1;
      continue;
    }

    const content = await readFile(join(root, file.path), "utf8");

    // Imports -> DEPENDS_ON
    if (CODE_LANGUAGES.has(file.language)) {
      for (const ref of scanImports(content, file.language)) {
        const resolved = resolveImport(file.path, ref.specifier, knownPaths);
        if (resolved !== undefined) {
          addEdge(edges, "DEPENDS_ON", file.id, `file:${resolved}`, { line: ref.line });
        }
      }
    }

    // Markdown links -> LINKS_TO
    if (file.ext === "md" || file.ext === "mdx") {
      for (const link of scanMarkdownLinks(content)) {
        const resolved = resolveMarkdownLink(file.path, link.target, knownPaths);
        if (resolved !== undefined) {
          addEdge(edges, "LINKS_TO", file.id, `file:${resolved}`, { line: link.line });
        }
      }
    }

    previousByKey.files.set(file.path, { node, edges: [] });
  }

  // File nodes whose link/dependency edges were not captured during reuse.
  // Re-scan markdown links for reused files so LINKS_TO stays complete even
  // when only one side of a link changed.
  await rescanLinksForReused(files, previousHashes, previousByKey, root, edges, nodes);

  // ---- Human-authored context --------------------------------------------
  await buildContextNodes(paths, nodes, edges, stamps);

  // ---- Event log -> Session / Decision / Finding ---------------------------
  buildEventNodes(options.events ?? [], nodes, edges);

  // ---- Health -------------------------------------------------------------
  const fileNodes = [...nodes.values()].filter((node) => node.type === "File");
  const connected = new Set<string>();
  for (const edge of edges.values()) {
    if (edge.type === "CONTAINS") {
      continue;
    }
    connected.add(edge.from);
    connected.add(edge.to);
  }
  const filesWithEdges = fileNodes.filter((node) => connected.has(node.id)).length;
  const staleFiles = fileNodes.filter((node) => {
    const date = node.properties.lastCommitAt;
    if (typeof date !== "string") {
      return false;
    }
    const then = Date.parse(date);
    return Number.isFinite(then) && Date.now() - then > 30 * 24 * 60 * 60 * 1000;
  }).length;
  const openItems = await countOpenItems(paths);

  const health: HealthReport = {
    coverage: fileNodes.length === 0 ? 100 : Math.round((filesWithEdges / fileNodes.length) * 100),
    stale: fileNodes.length === 0 ? 0 : Math.round((staleFiles / fileNodes.length) * 100),
    openItems,
    files: fileNodes.length,
    filesWithEdges,
    staleFiles,
  };

  return {
    nodes: sortNodes([...nodes.values()]),
    edges: sortEdges([...edges.values()]),
    hashes,
    health,
    stats: {
      files: files.length,
      dirs: dirs.length,
      nodes: nodes.size,
      edges: edges.size,
      changed,
      reused,
      skipped,
    },
  };
}

interface PreviousEntry {
  node: CtoNode;
  edges: CtoEdge[];
}

function indexPrevious(previous: BuildOptions["previous"]): {
  files: Map<string, PreviousEntry>;
  byNode: Map<string, CtoNode>;
} {
  const files = new Map<string, PreviousEntry>();
  const byNode = new Map<string, CtoNode>();
  for (const node of previous?.nodes ?? []) {
    byNode.set(node.id, node);
    if (node.type === "File" && typeof node.properties.path === "string") {
      files.set(node.properties.path, { node, edges: [] });
    }
  }
  for (const edge of previous?.edges ?? []) {
    if (edge.type === "CONTAINS") {
      continue;
    }
    for (const nodeId of [edge.from, edge.to]) {
      const node = byNode.get(nodeId);
      if (node?.type === "File" && typeof node.properties.path === "string") {
        files.get(node.properties.path)?.edges.push(edge);
      }
    }
  }
  return { files, byNode };
}

/**
 * Re-run the markdown link scan for reused files.
 *
 * Incremental reuse skips re-reading unchanged files, but LINKS_TO edges are
 * symmetric in practice: if a new file links to an old one, the old file's
 * side of the edge set must still be complete. We handle that here by only
 * re-reading reused markdown files when the previous index lacked links that
 * the current edge set suggests should exist - which we approximate by
 * re-reading all reused markdown (markdown is cheap; code is not).
 */
async function rescanLinksForReused(
  files: ScannedFile[],
  previousHashes: Record<string, string>,
  previousByKey: { files: Map<string, PreviousEntry> },
  root: string,
  edges: Map<string, CtoEdge>,
  nodes: Map<string, CtoNode>,
): Promise<void> {
  const knownPaths = new Set(files.map((file) => file.path));
  for (const file of files) {
    if (previousHashes[file.path] !== file.hash) {
      continue;
    }
    if (file.ext !== "md" && file.ext !== "mdx") {
      continue;
    }
    const entry = previousByKey.files.get(file.path);
    if (entry === undefined) {
      continue;
    }
    const node = nodes.get(file.id);
    if (node === undefined) {
      continue;
    }
    // Re-derive only the LINKS_TO edges for this file.
    for (const [id, edge] of [...edges]) {
      if (edge.from === file.id && edge.type === "LINKS_TO") {
        edges.delete(id);
      }
    }
    const content = await readFile(join(root, file.path), "utf8");
    for (const link of scanMarkdownLinks(content)) {
      const resolved = resolveMarkdownLink(file.path, link.target, knownPaths);
      if (resolved !== undefined) {
        addEdge(edges, "LINKS_TO", file.id, `file:${resolved}`, { line: link.line });
      }
    }
  }
}

/** context/, specs/, notes/, skills/ -> graph nodes. */
async function buildContextNodes(
  paths: CtoPaths,
  nodes: Map<string, CtoNode>,
  edges: Map<string, CtoEdge>,
  stamps: (id: string) => { createdAt: string; updatedAt: string },
): Promise<void> {
  const projectId = `project:${paths.root.split("/").pop() ?? "project"}`;

  // context/*.md become Note nodes typed by filename.
  for (const entry of await readDirSafe(paths.context)) {
    if (!entry.endsWith(".md")) {
      continue;
    }
    const id = `note:context-${entry.replace(/\.md$/, "")}`;
    const body = await readTextSafe(join(paths.context, entry));
    nodes.set(id, {
      id,
      type: "Note",
      name: entry.replace(/\.md$/, ""),
      properties: {
        path: `.cto-ai/context/${entry}`,
        section: "context",
        words: body.split(/\s+/).filter(Boolean).length,
        source: "context",
      },
      ...stamps(id),
    });
    addEdge(edges, "PART_OF", projectId, id);
    await linkMentions(id, body, edges);
  }

  // specs/*.md -> Spec + Task nodes.
  for (const entry of await readDirSafe(paths.specs)) {
    if (!entry.endsWith(".md")) {
      continue;
    }
    const raw = await readTextSafe(join(paths.specs, entry));
    const { frontmatter, body } = parseFrontmatter(raw);
    const unit =
      typeof frontmatter.unit === "string" ? frontmatter.unit : entry.replace(/\.md$/, "");
    const id = `spec:${unit}`;
    nodes.set(id, {
      id,
      type: "Spec",
      name: typeof frontmatter.title === "string" ? frontmatter.title : unit,
      properties: {
        path: `.cto-ai/specs/${entry}`,
        unit,
        status: typeof frontmatter.status === "string" ? frontmatter.status : "todo",
        dependsOn: Array.isArray(frontmatter.depends_on) ? frontmatter.depends_on : [],
        verify: Array.isArray(frontmatter.verify) ? frontmatter.verify : [],
        source: "specs",
      },
      ...stamps(id),
    });
    addEdge(edges, "PART_OF", projectId, id);
    for (const dep of Array.isArray(frontmatter.depends_on) ? frontmatter.depends_on : []) {
      if (typeof dep === "string" && dep.length > 0) {
        addEdge(edges, "IMPLEMENTS", `spec:${dep}`, id);
      }
    }
    let taskIndex = 0;
    for (const box of scanCheckboxes(body)) {
      taskIndex += 1;
      const taskId = `${id}/task:${String(taskIndex).padStart(2, "0")}`;
      nodes.set(taskId, {
        id: taskId,
        type: "Task",
        name: box.text,
        properties: { done: box.done, line: box.line, spec: unit, source: "specs" },
        ...stamps(taskId),
      });
      addEdge(edges, "PART_OF", id, taskId);
    }
  }

  // notes/*.md -> Note / Meeting / Decision / Person nodes.
  for (const entry of await readDirSafe(paths.notes)) {
    if (!entry.endsWith(".md")) {
      continue;
    }
    const raw = await readTextSafe(join(paths.notes, entry));
    const { frontmatter, body } = parseFrontmatter(raw);
    const slug = entry.replace(/\.md$/, "");
    const kind = typeof frontmatter.type === "string" ? frontmatter.type : "note";
    const type: CtoNode["type"] =
      kind === "meeting" ? "Meeting" : kind === "decision" ? "Decision" : "Note";
    const id = `${type.toLowerCase()}:${slug}`;
    nodes.set(id, {
      id,
      type,
      name: typeof frontmatter.title === "string" ? frontmatter.title : slug,
      properties: {
        path: `.cto-ai/notes/${entry}`,
        kind,
        date: typeof frontmatter.date === "string" ? frontmatter.date : "",
        source: "notes",
      },
      ...stamps(id),
    });
    addEdge(edges, "PART_OF", projectId, id);
    for (const person of Array.isArray(frontmatter.people) ? frontmatter.people : []) {
      if (typeof person === "string" && person.length > 0) {
        const personId = `person:${person.toLowerCase().replace(/\s+/g, "-")}`;
        nodes.set(personId, {
          id: personId,
          type: "Person",
          name: person,
          properties: { source: "notes" },
          ...stamps(personId),
        });
        addEdge(edges, "MENTIONS", id, personId);
      }
    }
    await linkMentions(id, body, edges);
  }

  // skills/*.md -> Skill nodes.
  for (const entry of await readDirSafe(paths.skills)) {
    if (!entry.endsWith(".md")) {
      continue;
    }
    const slug = entry.replace(/\.md$/, "");
    const id = `skill:${slug}`;
    nodes.set(id, {
      id,
      type: "Skill",
      name: slug,
      properties: { path: `.cto-ai/skills/${entry}`, source: "skills" },
      ...stamps(id),
    });
    addEdge(edges, "PART_OF", projectId, id);
  }
}

/**
 * MENTIONS edges: any `file:...`, `note:...`, `spec:...` style reference in
 * prose becomes an edge, so hand-written notes join the graph.
 */
async function linkMentions(
  fromId: string,
  body: string,
  edges: Map<string, CtoEdge>,
): Promise<void> {
  const pattern = /\b(file|dir|note|spec|skill|person|decision):[A-Za-z0-9_./-]+/g;
  const found = new Set<string>();
  for (const match of body.matchAll(pattern)) {
    const target = match[0];
    if (target !== fromId) {
      found.add(target);
    }
  }
  for (const target of [...found].sort()) {
    addEdge(edges, "MENTIONS", fromId, target);
  }
}

/** Event log -> Session / Decision / Finding nodes with temporal edges. */
export function buildEventNodes(
  events: CtoEvent[],
  nodes: Map<string, CtoNode>,
  edges: Map<string, CtoEdge>,
): void {
  const sorted = [...events].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const byId = new Map<string, CtoNode>();

  for (const event of sorted) {
    const type: CtoNode["type"] =
      event.kind === "session" ? "Session" : event.kind === "decision" ? "Decision" : "Finding";
    const id = event.id;
    const node: CtoNode = {
      id,
      type,
      name: event.text.slice(0, 120),
      properties: {
        kind: event.kind,
        text: event.text,
        body: event.body,
        createdAt: event.createdAt,
        machine: event.machine,
        closed: event.closedAt !== undefined,
        source: "log",
      },
      createdAt: event.createdAt,
      updatedAt: event.createdAt,
    };
    if (event.session !== undefined) {
      node.properties.session = event.session;
    }
    nodes.set(id, node);
    byId.set(id, node);

    for (const about of event.about) {
      addEdge(edges, "ABOUT", id, about);
      if (type === "Decision") {
        addEdge(edges, "DECIDED_IN", about, id);
      }
      if (type === "Finding") {
        addEdge(edges, "LEARNED_IN", about, id);
      }
    }
    if (event.session !== undefined && event.session !== id) {
      addEdge(edges, "PART_OF", id, event.session);
    }

    // A session closed later supersedes the previous closed session: Episode.
    if (event.kind === "session" && event.closedAt !== undefined) {
      const previous = [...byId.values()]
        .filter((n) => n.type === "Session" && n.id !== id && n.properties.closed === true)
        .sort(byCreatedAt)
        .pop();
      if (previous !== undefined) {
        addEdge(edges, "SUPERSEDES", id, previous.id);
      }
    }
    // Consecutive decisions about the same target supersede each other.
    if (type === "Decision") {
      for (const about of event.about) {
        const prior = [...byId.values()]
          .filter(
            (n) =>
              n.type === "Decision" &&
              n.id !== id &&
              n.properties.kind === "decision" &&
              hasAbout(n, about),
          )
          .sort(byCreatedAt)
          .pop();
        if (prior !== undefined) {
          addEdge(edges, "SUPERSEDES", id, prior.id);
        }
      }
    }
  }
}

function hasAbout(node: CtoNode, target: string): boolean {
  return typeof node.properties.about === "string" && node.properties.about.includes(target);
}

/** Ascending sort by createdAt, treating missing timestamps as empty strings. */
function byCreatedAt(a: CtoNode, b: CtoNode): number {
  return (a.createdAt ?? "") < (b.createdAt ?? "") ? -1 : 1;
}

export function sortNodes(nodes: CtoNode[]): CtoNode[] {
  return [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function sortEdges(edges: CtoEdge[]): CtoEdge[] {
  return [...edges].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

async function readDirSafe(dir: string): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  try {
    const entries = await readdir(dir);
    return entries.sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function readTextSafe(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

/** Unchecked checkboxes across context/ and specs/ = open work items. */
async function countOpenItems(paths: CtoPaths): Promise<number> {
  let count = 0;
  for (const dir of [paths.context, paths.specs]) {
    for (const entry of await readDirSafe(dir)) {
      if (!entry.endsWith(".md")) {
        continue;
      }
      const body = await readTextSafe(join(dir, entry));
      for (const box of scanCheckboxes(body)) {
        if (!box.done) {
          count += 1;
        }
      }
    }
  }
  return count;
}
