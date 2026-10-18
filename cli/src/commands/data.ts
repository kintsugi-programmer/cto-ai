import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { CtoaiError, ErrorCodes } from "../core/errors";
import type { CtoEdge, CtoNode } from "../core/schema";
import { openProject, requireInitialized } from "../project/open";
import { syncEntryFile } from "./init";

export type ExportFormat = "six-file" | "handoff" | "json";

export interface ExportOptions {
  root: string;
  format: ExportFormat;
  out?: string;
}

export interface ExportResult {
  format: ExportFormat;
  out: string;
  files: string[];
}

/**
 * `ctoai export` - write context out as portable files.
 *
 * This is the explicit, reviewable answer to "convert between file and
 * graph": no silent two-way sync, just a command you can read the diff of.
 */
export async function runExport(options: ExportOptions): Promise<ExportResult> {
  const { root, format } = options;
  requireInitialized(root);
  const out = options.out ?? join(root, ".cto-ai", "export");
  const project = await openProject(root);

  try {
    await mkdir(out, { recursive: true });
    const snapshot = await project.store.load();

    if (format === "json") {
      const path = join(out, "graph.json");
      await writeFile(
        path,
        `${JSON.stringify(
          { project: project.config.name, nodes: snapshot.nodes, edges: snapshot.edges },
          null,
          2,
        )}\n`,
        "utf8",
      );
      return { format, out, files: [path] };
    }

    if (format === "handoff") {
      const path = join(out, "handoff.md");
      await writeFile(path, renderHandoff(project.config.name, snapshot), "utf8");
      return { format, out, files: [path] };
    }

    // six-file: the six context documents, regenerated from the graph.
    const files: string[] = [];
    for (const [name, body] of Object.entries(renderSixFile(project.config.name, snapshot))) {
      const path = join(out, name);
      await writeFile(path, body, "utf8");
      files.push(path);
    }
    return { format, out, files: files.sort() };
  } finally {
    await project.store.close();
  }
}

export interface ImportOptions {
  root: string;
  /** Path to a six-file folder or a planning transcript. */
  source: string;
}

export interface ImportResult {
  imported: string[];
  /** Notes created from a transcript import. */
  notes: string[];
}

/**
 * `ctoai import <path>` - adopt existing context.
 *
 * A directory is treated as a six-file set (files land in `.cto-ai/context/`
 * with a provenance header). A single text file becomes a note.
 */
export async function runImport(options: ImportOptions): Promise<ImportResult> {
  const { root, source } = options;
  requireInitialized(root);
  const paths = ctoPathsOf(root);

  const stat = await import("node:fs/promises").then((fs) => fs.stat(source));
  const imported: string[] = [];
  const notes: string[] = [];

  if (stat.isDirectory()) {
    const names = (await readdir(source)).filter((name) => name.endsWith(".md")).sort();
    const mapping: Record<string, string> = {
      "prd.md": "project-overview.md",
      "progress.md": "progress-tracker.md",
      "architecture.md": "architecture.md",
      "standards.md": "code-standards.md",
      "workflow.md": "ai-workflow-rules.md",
      "ui.md": "ui-context.md",
    };
    for (const name of names) {
      const target = mapping[name] ?? name;
      const content = await readFile(join(source, name), "utf8");
      const provenance = `<!-- imported from ${source} by ctoai import -->\n`;
      await writeFile(join(paths.context, target), `${provenance}${content}`, "utf8");
      imported.push(target);
    }
  } else {
    const content = await readFile(source, "utf8");
    const slug =
      source
        .split("/")
        .pop()
        ?.replace(/\.md$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ?? "imported-note";
    await writeFile(join(paths.notes, `${slug}.md`), `${content}`, "utf8");
    notes.push(`${slug}.md`);
  }

  // Re-sync entry files so the managed block reflects the import.
  for (const name of ["AGENTS.md", "CLAUDE.md"]) {
    await syncEntryFile(root, name).catch(() => undefined);
  }

  return { imported: imported.sort(), notes: notes.sort() };
}

function ctoPathsOf(root: string) {
  return {
    context: join(root, ".cto-ai", "context"),
    notes: join(root, ".cto-ai", "notes"),
  };
}

function renderHandoff(name: string, snapshot: { nodes: CtoNode[]; edges: CtoEdge[] }): string {
  const byType = new Map<string, CtoNode[]>();
  for (const node of snapshot.nodes) {
    const bucket = byType.get(node.type);
    if (bucket === undefined) {
      byType.set(node.type, [node]);
    } else {
      bucket.push(node);
    }
  }
  const lines: string[] = [`# Handoff: ${name}`, ""];
  lines.push(
    `Generated from the cto-ai graph: ${snapshot.nodes.length} nodes, ${snapshot.edges.length} edges.`,
    "",
  );

  const memory = [...(byType.get("Decision") ?? []), ...(byType.get("Finding") ?? [])].sort(
    (a, b) => ((a.createdAt ?? "") < (b.createdAt ?? "") ? 1 : -1),
  );
  if (memory.length > 0) {
    lines.push("## Decisions and findings", "");
    for (const node of memory.slice(0, 50)) {
      lines.push(`- **${node.type}** (${node.createdAt ?? "unknown date"}): ${node.name}`);
    }
    lines.push("");
  }

  const specs = byType.get("Spec") ?? [];
  if (specs.length > 0) {
    lines.push("## Build plan", "");
    for (const spec of specs.sort((a, b) => (a.id < b.id ? -1 : 1))) {
      lines.push(`- \`${spec.id}\` ${spec.name} - ${String(spec.properties.status ?? "todo")}`);
    }
    lines.push("");
  }

  const files = byType.get("File") ?? [];
  if (files.length > 0) {
    lines.push(`## Files (${files.length})`, "");
    for (const file of files.slice(0, 100)) {
      lines.push(`- \`${String(file.properties.path ?? file.id)}\``);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderSixFile(
  name: string,
  snapshot: { nodes: CtoNode[]; edges: CtoEdge[] },
): Record<string, string> {
  const files = snapshot.nodes.filter((node) => node.type === "File");
  const specs = snapshot.nodes.filter((node) => node.type === "Spec");
  const decisions = snapshot.nodes
    .filter((node) => node.type === "Decision")
    .sort((a, b) => ((a.createdAt ?? "") < (b.createdAt ?? "") ? 1 : -1));

  return {
    "project-overview.md": `# Project Overview\n\n**Project** - ${name}\n\n**Files indexed** - ${files.length}\n\n**Graph** - ${snapshot.nodes.length} nodes, ${snapshot.edges.length} edges\n`,
    "architecture.md": `# Architecture\n\n## Shape\n\n${
      files
        .slice(0, 30)
        .map((file) => `- \`${String(file.properties.path ?? file.id)}\``)
        .join("\n") || "- (nothing indexed yet)"
    }\n`,
    "code-standards.md": `# Code Standards\n\nTODO: export does not infer standards; write them here once.\n`,
    "ai-workflow-rules.md": `# AI Workflow Rules\n\n**Before starting work** - run \`npx ctoai resume\`.\n\n**Before changing a protected path** - run \`npx ctoai guards <path>\`.\n`,
    "ui-context.md": `# UI Context\n\nTODO.\n`,
    "progress-tracker.md": `# Progress\n\n${specs.map((spec) => `- [${String(spec.properties.status) === "done" ? "x" : " "}] ${spec.id} ${spec.name}`).join("\n") || "- [ ] No specs yet"}\n\n## Recent decisions\n\n${
      decisions
        .slice(0, 20)
        .map((decision) => `- (${decision.createdAt ?? ""}) ${decision.name}`)
        .join("\n") || "- none recorded"
    }\n`,
  };
}

export { CtoaiError, ErrorCodes };
