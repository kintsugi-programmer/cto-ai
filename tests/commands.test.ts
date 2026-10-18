import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runExport, runImport } from "../src/commands/data";
import { runCheck, runGuards } from "../src/commands/guards";
import { runInit } from "../src/commands/init";
import { runQuery } from "../src/commands/query";
import { runRecord } from "../src/commands/record";
import { runResume } from "../src/commands/resume";
import { runSpecClose, runSpecList, runSpecNext } from "../src/commands/spec";
import { runStatus } from "../src/commands/status";
import { runSync } from "../src/commands/sync";
import { ErrorCodes } from "../src/core/errors";

const exec = promisify(execFile);
let root: string;

/** A small but realistic fixture: code with imports, docs with links, git. */
async function makeFixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "ctoai-fixture-"));
  const files: Record<string, string> = {
    "src/cli.ts": 'import { store } from "./store";\nexport const main = () => store();\n',
    "src/store.ts": 'import { util } from "./util";\nexport const store = () => util();\n',
    "src/util.ts": "export const util = () => 42;\n",
    "docs/index.md": "# Docs\n\nSee [setup](./setup.md).\n",
    "docs/setup.md": "# Setup\n\nInstall it.\n",
    ".gitignore": "node_modules/\n.cto-ai/index/\n",
  };
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    await mkdir(join(full, ".."), { recursive: true });
    await writeFile(full, content, "utf8");
  }
  await exec("git", ["init", "-q"], { cwd: dir });
  await exec("git", ["config", "user.email", "t@example.com"], { cwd: dir });
  await exec("git", ["config", "user.name", "Test"], { cwd: dir });
  await exec("git", ["add", "-A"], { cwd: dir });
  await exec("git", ["commit", "-qm", "initial"], { cwd: dir });
  return dir;
}

beforeEach(async () => {
  root = await makeFixture();
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("init", () => {
  it("scaffolds .cto-ai and is idempotent on re-run", async () => {
    const first = await runInit({ root });
    expect(first.created).toContain(".cto-ai/config.json");
    expect(first.entryFiles.find((e) => e.file === "AGENTS.md")?.action).toBe("created");

    const second = await runInit({ root });
    // Nothing new the second time; the block is not duplicated.
    expect(second.created).toEqual([]);
    expect(second.alreadyInitialized).toBe(true);

    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    expect(agents.match(/<!-- cto-ai:begin -->/g)).toHaveLength(1);
  });

  it("keeps the managed block stable across many re-runs", async () => {
    await runInit({ root });
    const first = await readFile(join(root, "CLAUDE.md"), "utf8");
    await runInit({ root });
    await runInit({ root });
    expect(await readFile(join(root, "CLAUDE.md"), "utf8")).toBe(first);
  });

  it("writes context templates and a README", async () => {
    await runInit({ root });
    const names = [
      "project-overview.md",
      "architecture.md",
      "code-standards.md",
      "ai-workflow-rules.md",
      "ui-context.md",
      "progress-tracker.md",
    ];
    for (const name of names) {
      await expect(readFile(join(root, ".cto-ai/context", name), "utf8")).resolves.toContain("#");
    }
    await expect(readFile(join(root, ".cto-ai/README.md"), "utf8")).resolves.toContain(
      "append-only",
    );
  });

  it("ignores .cto-ai/index in git", async () => {
    await runInit({ root });
    const gitignore = await readFile(join(root, ".gitignore"), "utf8");
    expect(gitignore).toContain(".cto-ai/index/");
  });
});

describe("sync", () => {
  beforeEach(async () => {
    await runInit({ root });
  });

  it("builds an index with files, dirs, imports, and links", async () => {
    const result = await runSync({ root });
    expect(result.stats.files).toBeGreaterThan(0);
    const ids = result.nodes.map((node) => node.id);
    expect(ids).toContain("file:src/cli.ts");
    expect(ids).toContain("dir:src");

    const depIds = result.edges.filter((e) => e.type === "DEPENDS_ON").map((e) => e.id);
    expect(depIds).toContain("file:src/cli.ts|DEPENDS_ON|file:src/store.ts");
    expect(depIds).toContain("file:src/store.ts|DEPENDS_ON|file:src/util.ts");

    const linkIds = result.edges.filter((e) => e.type === "LINKS_TO").map((e) => e.id);
    expect(linkIds).toContain("file:docs/index.md|LINKS_TO|file:docs/setup.md");
  });

  it("is byte-identical across consecutive runs (determinism rule)", async () => {
    await runSync({ root });
    const second = await runSync({ root });
    expect(second.unchanged).toBe(true);
    const third = await runSync({ root });
    expect(third.unchanged).toBe(true);
  });

  it("reuses unchanged files and only reprocesses the changed one", async () => {
    await runSync({ root });
    await writeFile(join(root, "src/util.ts"), "export const util = () => 43;\n", "utf8");
    const result = await runSync({ root });
    expect(result.stats.changed).toBe(1);
    expect(result.stats.reused).toBeGreaterThan(1);
  });

  it("picks up a brand new file", async () => {
    await runSync({ root });
    await writeFile(join(root, "src/new.ts"), "export const n = 1;\n", "utf8");
    const result = await runSync({ root });
    expect(result.nodes.map((node) => node.id)).toContain("file:src/new.ts");
  });

  it("survives deleting the index and rebuilding", async () => {
    await runSync({ root });
    await rm(join(root, ".cto-ai/index"), { recursive: true, force: true });
    const rebuilt = await runSync({ root });
    expect(rebuilt.stats.files).toBeGreaterThan(0);
  });

  it("collects git metadata onto file nodes", async () => {
    const result = await runSync({ root });
    const cli = result.nodes.find((node) => node.id === "file:src/cli.ts");
    expect(typeof cli?.properties.lastCommit).toBe("string");
    expect(typeof cli?.properties.lastCommitAt).toBe("string");
  });
});

describe("status and health", () => {
  it("reports coverage after a sync", async () => {
    await runInit({ root });
    await runSync({ root });
    const status = await runStatus({ root });
    expect(status.nodes).toBeGreaterThan(0);
    expect(status.backend).toBe("file");
    expect(status.health.coverage).toBeGreaterThan(0);
    expect(status.syncedAt).not.toBeNull();
  });

  it("errors clearly before init", async () => {
    const bare = await mkdtemp(join(tmpdir(), "ctoai-bare-"));
    try {
      await expect(runStatus({ root: bare })).rejects.toMatchObject({
        code: ErrorCodes.NOT_INITIALIZED,
      });
    } finally {
      await rm(bare, { recursive: true, force: true });
    }
  });
});

describe("record, recall, timeline, resume", () => {
  beforeEach(async () => {
    await runInit({ root });
    await runSync({ root });
  });

  it("records a decision and recalls it immediately, without a re-sync", async () => {
    await runRecord({
      root,
      kind: "decision",
      text: "use the file store",
      about: ["file:src/cli.ts"],
    });
    const recall = await runQuery({ root, tool: "recall", args: { about: "src/cli.ts" } });
    expect(recall.outcome).toBe("from-memory");
    expect((recall.data.matches as unknown[]).length).toBe(1);
  });

  it("builds a timeline from the log", async () => {
    await runRecord({
      root,
      kind: "finding",
      text: "cli is the entrypoint",
      about: ["file:src/cli.ts"],
    });
    const timeline = await runQuery({ root, tool: "timeline", args: { path: "src/cli.ts" } });
    expect((timeline.data.events as unknown[]).length).toBe(1);
  });

  it("opens a session, closes it, and surfaces it in resume", async () => {
    await runRecord({ root, kind: "session", text: "started the scanner" });
    const closed = await runRecord({
      root,
      kind: "session",
      text: "closing time",
      session: "latest",
    });
    // Closing stamps the original rather than rewriting its text.
    expect(closed.event.text).toBe("started the scanner");
    expect(closed.event.session).toBeDefined();

    const resume = await runResume({ root });
    expect(resume.lastSession?.text).toBe("started the scanner");
    // The original is no longer open, so resume must not report it in progress.
    expect(resume.nextUp.join(" ")).not.toContain("Open session in progress");
  });

  it("refuses to close a session twice", async () => {
    await runRecord({ root, kind: "session", text: "one" });
    await runRecord({ root, kind: "session", text: "close", session: "latest" });
    await expect(
      runRecord({ root, kind: "session", text: "again", session: "latest" }),
    ).rejects.toMatchObject({ code: ErrorCodes.INVALID_ARGUMENT });
  });

  it("requires non-empty text", async () => {
    await expect(runRecord({ root, kind: "finding", text: "  " })).rejects.toMatchObject({
      code: ErrorCodes.INVALID_ARGUMENT,
    });
  });

  it("rejects an unknown event kind", async () => {
    await expect(runRecord({ root, kind: "epiphany", text: "x" })).rejects.toMatchObject({
      code: ErrorCodes.INVALID_ARGUMENT,
    });
  });

  it("resume lists next-up and recent memory", async () => {
    await runRecord({ root, kind: "decision", text: "pick zod", about: ["file:src/util.ts"] });
    const resume = await runResume({ root });
    expect(resume.recentDecisions[0]?.text).toBe("pick zod");
    expect(resume.nextUp.length).toBeGreaterThan(0);
  });
});

describe("query argument validation", () => {
  beforeEach(async () => {
    await runInit({ root });
    await runSync({ root });
  });

  it("rejects an out-of-range depth with the field named", async () => {
    await expect(
      runQuery({ root, tool: "blast_radius", args: { path: "src/cli.ts", depth: 99 } }),
    ).rejects.toMatchObject({ code: ErrorCodes.INVALID_ARGUMENT });
  });

  it("rejects an unknown tool", async () => {
    await expect(runQuery({ root, tool: "teleport", args: {} })).rejects.toMatchObject({
      code: ErrorCodes.UNKNOWN_TOOL,
    });
  });

  it("answers blast_radius on a real dependency", async () => {
    const result = await runQuery({
      root,
      tool: "blast_radius",
      args: { path: "src/util.ts", depth: 2 },
    });
    expect(result.path).toContain("file:src/cli.ts");
  });

  it("answers load_bearing with util first (most depended upon)", async () => {
    const result = await runQuery({ root, tool: "load_bearing", args: { limit: 1 } });
    expect((result.data.ranked as Array<{ node: string }>)[0]?.node).toBe("file:src/util.ts");
  });
});

describe("spec workflow", () => {
  beforeEach(async () => {
    await runInit({ root });
    await runSpecWrite(root, "01-scanner", "Scanner", ["02"], []);
    await runSpecWrite(root, "02-tools", "Tools", [], ["echo ok"]);
  });

  it("resolves the build order through dependencies", async () => {
    // 02 has no deps, 01 depends on 02, so 02 is next.
    const next = await runSpecNext({ root });
    expect(next?.unit).toBe("02");

    await runSpecClose({ root, unit: "02" });
    const afterClose = await runSpecNext({ root });
    expect(afterClose?.unit).toBe("01");
  });

  it("closes a unit by running its verify commands", async () => {
    const result = await runSpecClose({ root, unit: "02" });
    expect(result.done).toBe(true);
    expect(result.ran[0]?.command).toBe("echo ok");

    const list = await runSpecList({ root });
    expect(list.progress.done).toBe(1);
    expect(list.units.find((u) => u.unit === "02")?.status).toBe("done");
  });

  it("does not close a unit whose verify command fails", async () => {
    await runSpecWrite(root, "03-bad", "Bad", [], ["exit 1"]);
    const result = await runSpecClose({ root, unit: "03" });
    expect(result.done).toBe(false);
    expect(result.ran[0]?.ok).toBe(false);
  });

  it("errors clearly for an unknown unit", async () => {
    await expect(runSpecClose({ root, unit: "99" })).rejects.toMatchObject({
      code: ErrorCodes.SPEC_NOT_FOUND,
    });
  });

  it("flags a dependency cycle instead of hanging", async () => {
    await runSpecWrite(root, "04-cycle-a", "A", ["05"], []);
    await runSpecWrite(root, "05-cycle-b", "B", ["04"], []);
    await expect(runSpecNext({ root })).rejects.toMatchObject({
      code: ErrorCodes.DEPENDENCY_CYCLE,
    });
  });
});

describe("guards and check", () => {
  beforeEach(async () => {
    await runInit({ root });
  });

  it("matches a rule against a path under the protected directory", async () => {
    const result = await runGuards({ root, path: ".cto-ai/log/decisions/a.json" });
    expect(result.rules.length).toBeGreaterThan(0);
    expect(result.safe).toBe(false);
  });

  it("reports an unprotected path as safe", async () => {
    const result = await runGuards({ root, path: "src/cli.ts" });
    expect(result.safe).toBe(true);
  });

  it("detects a dirty protected file as a violation", async () => {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(root, ".cto-ai/log/findings"), { recursive: true });
    await writeFile(join(root, ".cto-ai/log/findings/probe.json"), "{}\n", "utf8");
    const result = await runCheck({ root });
    expect(result.ok).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });
});

describe("export and import", () => {
  beforeEach(async () => {
    await runInit({ root });
    await runSync({ root });
  });

  it("exports JSON with the full snapshot", async () => {
    const out = join(root, "out-json");
    const result = await runExport({ root, format: "json", out });
    expect(result.files).toHaveLength(1);
    const parsed = JSON.parse(await readFile(result.files[0] as string, "utf8")) as {
      nodes: unknown[];
      edges: unknown[];
    };
    expect(parsed.nodes.length).toBeGreaterThan(0);
    expect(parsed.edges.length).toBeGreaterThan(0);
  });

  it("exports a human-readable handoff", async () => {
    const out = join(root, "out-handoff");
    const result = await runExport({ root, format: "handoff", out });
    const content = await readFile(result.files[0] as string, "utf8");
    expect(content).toContain("# Handoff");
    expect(content).toContain("## Files");
  });

  it("exports the six-file set", async () => {
    const out = join(root, "out-six");
    const result = await runExport({ root, format: "six-file", out });
    expect(result.files.length).toBe(6);
  });

  it("round-trips a six-file folder through import", async () => {
    const source = join(root, "incoming");
    await mkdir(source, { recursive: true });
    await writeFile(join(source, "prd.md"), "# PRD\n\nImported product doc.\n", "utf8");

    const result = await runImport({ root, source });
    expect(result.imported).toContain("project-overview.md");
    const content = await readFile(join(root, ".cto-ai/context/project-overview.md"), "utf8");
    expect(content).toContain("Imported product doc.");
    expect(content).toContain("imported from");
  });

  it("imports a lone transcript as a note", async () => {
    const transcript = join(root, "planning.txt");
    await writeFile(transcript, "We agreed to build the scanner first.\n", "utf8");
    const result = await runImport({ root, source: transcript });
    // The slug is sanitized into a filesystem-safe name.
    expect(result.notes).toEqual(["planning-txt.md"]);
    await expect(readFile(join(root, ".cto-ai/notes/planning-txt.md"), "utf8")).resolves.toContain(
      "build the scanner first",
    );
  });
});

describe("graph tools on a fixture", () => {
  beforeEach(async () => {
    await runInit({ root });
    await runSync({ root });
  });

  it("context_for returns relevant artifacts", async () => {
    const result = await runQuery({
      root,
      tool: "context_for",
      args: { task: "store util", limit: 5 },
    });
    expect(result.outcome).toBe("answered");
    expect(result.path.length).toBeGreaterThan(0);
  });

  it("status reports counts", async () => {
    const result = await runQuery({ root, tool: "status", args: {} });
    expect(Number(result.data.nodes)).toBeGreaterThan(0);
  });
});

async function runSpecWrite(
  root: string,
  filename: string,
  title: string,
  dependsOn: string[],
  verify: string[],
): Promise<void> {
  const dir = join(root, ".cto-ai/specs");
  await mkdir(dir, { recursive: true });
  const depends =
    dependsOn.length > 0 ? `\ndepends_on:\n${dependsOn.map((d) => `  - "${d}"`).join("\n")}` : "";
  const verifyBlock =
    verify.length > 0 ? `\nverify:\n${verify.map((v) => `  - "${v}"`).join("\n")}` : "";
  const unit = filename.split("-")[0] as string;
  await writeFile(
    join(dir, `${filename}.md`),
    `---\nunit: "${unit}"\ntitle: ${title}\nstatus: todo${depends}${verifyBlock}\n---\n\n## Tasks\n\n- [ ] do the work\n`,
    "utf8",
  );
}
