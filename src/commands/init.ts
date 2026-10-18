import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { type Config, ConfigSchema } from "../core/config";
import { BLOCK_BEGIN, BLOCK_END, ctoPaths, defaultProjectName } from "../core/paths";
import { loadConfig, saveConfig } from "../project/open";

/** The managed block inserted into entry files. */
export function managedBlock(root: string): string {
  const display = root.split("/").pop() ?? "this project";
  return [
    BLOCK_BEGIN,
    `This project uses cto-ai for project context (${display}).`,
    "Run `npx ctoai resume` - or call the `resume` tool over MCP - before starting work,",
    "and `npx ctoai guards <path>` before changing a protected path.",
    BLOCK_END,
  ].join("\n");
}

/** Idempotently write the managed block into one entry file. */
export async function syncEntryFile(
  root: string,
  name: string,
): Promise<"created" | "updated" | "unchanged"> {
  const path = join(root, name);
  const block = managedBlock(root);
  let existing = "";
  try {
    existing = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const begin = existing.indexOf(BLOCK_BEGIN);
  const end = existing.indexOf(BLOCK_END);
  let next: string;
  if (begin !== -1 && end !== -1 && end > begin) {
    const before = existing.slice(0, begin).replace(/\s+$/, "");
    const after = existing.slice(end + BLOCK_END.length).replace(/^\s+/, "");
    next = `${before}\n\n${block}\n${after ? `\n${after}` : ""}`;
  } else if (existing.trim().length === 0) {
    next = `# ${name}\n\n${block}\n`;
  } else {
    next = `${existing.replace(/\s+$/, "")}\n\n${block}\n`;
  }

  if (next === existing) {
    return "unchanged";
  }
  await writeFile(path, next, "utf8");
  return begin === -1 ? "created" : "updated";
}

const README_BODY = `# .cto-ai/

Project context for coding agents. Managed by \`ctoai\`.

- \`context/\` - human-authored project context (overview, architecture, standards, workflow rules).
- \`specs/\` - the build plan and unit specs; \`ctoai spec next\` picks the next buildable unit.
- \`notes/\` - user and meeting notes (\`type: meeting\` in frontmatter becomes a Meeting node).
- \`skills/\` - procedural memory: conventions and repeatable recipes.
- \`log/\` - append-only agent memory. One JSON file per event. Never rewritten.
- \`index/\` - derived graph index (nodes.jsonl, edges.jsonl, hashes.json, health.json). Gitignored; rebuild with \`ctoai sync\`.

Rules: humans own \`context/\`, \`specs/\`, \`notes/\`, \`skills/\`. The agent owns \`log/\`. The \`index/\` is disposable.
`;

const CONTEXT_TEMPLATES: Record<string, string> = {
  "project-overview.md": `# Project Overview

**What this project does** - TODO one paragraph.

**Who it is for** - TODO.

**Success looks like** - TODO.
`,
  "architecture.md": `# Architecture

**Shape** - TODO: the main pieces and how they connect.

## Guards

Protected paths and the invariants they carry. Format: \`glob = rule\`.

\`\`\`
.cto-ai/log/ = append-only agent memory; never rewrite an event file
\`\`\`
`,
  "code-standards.md": `# Code Standards

**Style** - TODO.

**Testing** - TODO: what must be covered before a unit is done.
`,
  "ai-workflow-rules.md": `# AI Workflow Rules

**Before starting work** - run \`npx ctoai resume\`.

**Before changing a protected path** - run \`npx ctoai guards <path>\`.

**When a decision changes** - record it: \`npx ctoai record decision --text "..." --about <ref>\`.
`,
  "ui-context.md": `# UI Context

TODO: design tokens, component conventions, screenshots of key screens.
`,
  "progress-tracker.md": `# Progress

- [ ] First unit
`,
};

/** Import existing six-file / AGENTS.md style docs into .cto-ai/context/. */
async function importExistingContext(root: string, target: string): Promise<string[]> {
  const imported: string[] = [];
  const candidates = [
    { from: join(root, "AGENTS.md"), to: "ai-workflow-rules.md" },
    { from: join(root, "CLAUDE.md"), to: "ai-workflow-rules.md" },
    { from: join(root, "context", "prd.md"), to: "project-overview.md" },
    { from: join(root, "context", "progress.md"), to: "progress-tracker.md" },
  ];
  for (const candidate of candidates) {
    let content: string;
    try {
      content = await readFile(candidate.from, "utf8");
    } catch {
      continue;
    }
    if (content.trim().length === 0) {
      continue;
    }
    const destination = join(target, candidate.to);
    let existing = "";
    try {
      existing = await readFile(destination, "utf8");
    } catch {
      // Fresh template; the import replaces it wholesale.
    }
    if (existing.startsWith("# ") && !existing.includes("TODO")) {
      // A template already lives here and looks authored; prepend provenance
      // instead of overwriting.
      continue;
    }
    const provenance = `<!-- imported from ${candidate.from.replace(`${root}/`, "")} by ctoai init -->\n`;
    await writeFile(destination, `${provenance}${content}`, "utf8");
    imported.push(candidate.from.replace(`${root}/`, ""));
  }
  return imported;
}

export interface InitOptions {
  root: string;
  force?: boolean;
  json?: boolean;
}

export interface InitResult {
  root: string;
  created: string[];
  imported: string[];
  entryFiles: Array<{ file: string; action: string }>;
  config: Config;
  alreadyInitialized: boolean;
}

/** `ctoai init` - scan the repo, scaffold `.cto-ai/`, adopt existing context. */
export async function runInit(options: InitOptions): Promise<InitResult> {
  const { root } = options;
  const paths = ctoPaths(root);
  const alreadyInitialized = await exists(paths.base);

  const config: Config = options.force
    ? ConfigSchema.parse({ name: defaultProjectName(root) })
    : await loadConfig(root);

  const created: string[] = [];
  const dirs = [
    paths.base,
    paths.context,
    paths.specs,
    paths.notes,
    paths.skills,
    paths.log,
    paths.logSessions,
    paths.logFindings,
    paths.logDecisions,
  ];
  for (const dir of dirs) {
    if (!(await exists(dir))) {
      await mkdir(dir, { recursive: true });
      created.push(`${dir.replace(`${root}/`, "")}/`);
    }
  }

  for (const [name, body] of Object.entries(CONTEXT_TEMPLATES)) {
    const path = join(paths.context, name);
    if (!(await exists(path))) {
      await writeFile(path, body, "utf8");
      created.push(`.cto-ai/context/${name}`);
    }
  }

  if (!(await exists(paths.readmePath))) {
    await writeFile(paths.readmePath, README_BODY, "utf8");
    created.push(".cto-ai/README.md");
  }

  if (!(await exists(paths.configPath))) {
    await saveConfig(root, config);
    created.push(".cto-ai/config.json");
  }

  const imported = await importExistingContext(root, paths.context);

  const entryFiles: Array<{ file: string; action: string }> = [];
  for (const name of config.entryFiles) {
    // .cursorrules only gets a block when the file already exists; agents
    // that do not read it should not be handed a new one.
    if (name === ".cursorrules" && !(await exists(join(root, name)))) {
      continue;
    }
    entryFiles.push({ file: name, action: await syncEntryFile(root, name) });
  }

  // Keep .cto-ai/index out of git: it is derived data.
  await ensureIndexIgnored(root);

  return {
    root,
    created: created.sort(),
    imported: imported.sort(),
    entryFiles,
    config,
    alreadyInitialized,
  };
}

async function ensureIndexIgnored(root: string): Promise<void> {
  const path = join(root, ".gitignore");
  let content = "";
  try {
    content = await readFile(path, "utf8");
  } catch {
    // No .gitignore yet.
  }
  const line = ".cto-ai/index/";
  if (content.split("\n").some((existing) => existing.trim() === line)) {
    return;
  }
  const next = `${content.replace(/\s*$/, "\n")}\n${line}\n`;
  await writeFile(path, next, "utf8");
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
