#!/usr/bin/env node
import { Command, Option } from "commander";
import { runConnect } from "./commands/connect";
import { runExport, runImport } from "./commands/data";
import { runCheck, runGuards } from "./commands/guards";
import { runInit } from "./commands/init";
import { serveMcp } from "./commands/mcp";
import { runQuery, TOOL_NAMES } from "./commands/query";
import { runRecord } from "./commands/record";
import { runResume } from "./commands/resume";
import { runSpecClose, runSpecList, runSpecNext } from "./commands/spec";
import { runStatus } from "./commands/status";
import { runSync } from "./commands/sync";
import { toCtoaiError } from "./core/errors";
import { emit } from "./core/json";
import { resolveProjectRoot } from "./core/paths";

declare const __CTOAI_VERSION__: string;

const program = new Command()
  .name("ctoai")
  .description(
    "The persistent project brain for any coding agent. File-first, graph-powered, MCP-native.",
  )
  .version(__CTOAI_VERSION__)
  .option("-C, --cwd <dir>", "project directory (default: walk up from here)")
  .addOption(new Option("--json", "machine-readable output").conflicts("pretty"));

function root(): string {
  const cwd = program.opts<{ cwd?: string }>().cwd ?? process.cwd();
  return resolveProjectRoot(cwd);
}

function wantsJson(): boolean {
  return program.opts<{ json?: boolean }>().json === true;
}

/** Run a command body, printing either JSON or human text, with stable errors. */
async function run(body: () => Promise<{ json: unknown; human: string }>): Promise<void> {
  try {
    const result = await body();
    emit(wantsJson(), result.json, () => result.human);
  } catch (error) {
    const ctoai = toCtoaiError(error);
    if (wantsJson()) {
      process.stdout.write(`${JSON.stringify({ error: ctoai.code, message: ctoai.message })}\n`);
    } else {
      process.stderr.write(`ctoai: ${ctoai.message}\n`);
    }
    process.exitCode = 1;
  }
}

// --------------------------------------------------------------------------

program
  .command("init")
  .option("--force", "overwrite config with defaults")
  .description("scan the repository and set up the .cto-ai context folder")
  .action(async (options: { force?: boolean }) => {
    await run(async () => {
      const result = await runInit({
        root: root(),
        ...(options.force === true ? { force: true } : {}),
      });
      const human = [
        `Initialized cto-ai in ${result.root}`,
        result.alreadyInitialized ? "(re-ran: existing files were kept)" : "",
        `created: ${result.created.length === 0 ? "nothing new" : result.created.join(", ")}`,
        `imported: ${result.imported.length === 0 ? "nothing" : result.imported.join(", ")}`,
        ...result.entryFiles.map((entry) => `entry file ${entry.file}: ${entry.action}`),
        "",
        "Next: `ctoai sync` to build the index, then `ctoai resume`.",
      ]
        .filter((line) => line !== "")
        .join("\n");
      return { json: result, human };
    });
  });

program
  .command("sync")
  .option("--full", "rebuild from scratch instead of reusing the previous index")
  .option("--no-git", "skip git metadata collection")
  .description("rebuild the project index incrementally")
  .action(async (options: { full?: boolean; git?: boolean }) => {
    await run(async () => {
      const result = await runSync({
        root: root(),
        ...(options.full === true ? { full: true } : {}),
        ...(options.git === false ? { noGit: true } : {}),
      });
      const s = result.stats;
      const human = [
        `Indexed ${s.files} files, ${s.dirs} directories -> ${s.nodes} nodes, ${s.edges} edges.`,
        `changed ${s.changed}, reused ${s.reused}, binary skipped ${s.skipped}.`,
        `coverage ${result.health.coverage}%, stale ${result.health.stale}%, open items ${result.health.openItems}.`,
        result.unchanged ? "index unchanged (byte-identical to the previous run)" : "index written",
      ].join("\n");
      return { json: result, human };
    });
  });

program
  .command("status")
  .description("show context coverage and health")
  .action(async () => {
    await run(async () => {
      const result = await runStatus({ root: root() });
      const lines = [
        `${result.project} [${result.backend}]`,
        `nodes ${result.nodes}, edges ${result.edges}`,
        `coverage ${result.health.coverage}%, stale ${result.health.stale}%, open items ${result.health.openItems}`,
        `last sync: ${result.syncedAt ?? "never"}`,
        "",
        "by type:",
        ...Object.entries(result.byType).map(([type, count]) => `  ${type}: ${count}`),
      ];
      return { json: result, human: lines.join("\n") };
    });
  });

program
  .command("resume")
  .option("-n, --limit <n>", "items per list", (value: string) => Number(value))
  .description("restore full project context in one call")
  .action(async (options: { limit?: number }) => {
    await run(async () => {
      const result = await runResume({
        root: root(),
        ...(Number.isFinite(options.limit) ? { limit: options.limit as number } : {}),
      });
      const lines = [
        `# ${result.project}`,
        "",
        "next up:",
        ...result.nextUp.map((item) => `- ${item}`),
      ];
      if (result.lastSession !== null) {
        lines.push(
          "",
          `last session (${result.lastSession.createdAt}):`,
          `- ${result.lastSession.text}`,
        );
      }
      if (result.recentDecisions.length > 0) {
        lines.push("", "recent decisions:");
        for (const decision of result.recentDecisions) {
          lines.push(`- (${decision.createdAt}) ${decision.text}`);
        }
      }
      if (result.recentFindings.length > 0) {
        lines.push("", "recent findings:");
        for (const finding of result.recentFindings) {
          lines.push(`- (${finding.createdAt}) ${finding.text}`);
        }
      }
      if (result.openQuestions.length > 0) {
        lines.push("", "open questions:");
        for (const question of result.openQuestions) {
          lines.push(`- ${question}`);
        }
      }
      return { json: result, human: lines.join("\n") };
    });
  });

program
  .command("query")
  .argument("<tool>", `tool name: ${TOOL_NAMES.join(", ")}`)
  .option("--path <path>", "path argument")
  .option("--from <node>", "from node")
  .option("--to <node>", "to node")
  .option("--task <task>", "task text")
  .option("--about <node>", "node reference")
  .option("--depth <n>", "hops", (value: string) => Number(value))
  .option("--limit <n>", "max results", (value: string) => Number(value))
  .description("run a context tool against the project graph")
  .action(
    async (
      tool: string,
      options: {
        path?: string;
        from?: string;
        to?: string;
        task?: string;
        about?: string;
        depth?: number;
        limit?: number;
      },
    ) => {
      await run(async () => {
        const args: Record<string, unknown> = {};
        if (options.path !== undefined) args.path = options.path;
        if (options.from !== undefined) args.from = options.from;
        if (options.to !== undefined) args.to = options.to;
        if (options.task !== undefined) args.task = options.task;
        if (options.about !== undefined) args.about = options.about;
        if (Number.isFinite(options.depth)) args.depth = options.depth;
        if (Number.isFinite(options.limit)) args.limit = options.limit;

        const result = await runQuery({ root: root(), tool, args });
        const lines = [`[${result.outcome}] ${result.answer}`];
        if (result.path.length > 0) {
          lines.push("", "path walked:", ...result.path.map((node) => `  ${node}`));
        }
        return { json: result, human: lines.join("\n") };
      });
    },
  );

program
  .command("record")
  .argument("[kind]", "session | finding | decision")
  .option("--text <text>", "one-line summary")
  .option("--body <body>", "longer detail")
  .option("--about <refs...>", "node ids this is about")
  .option("--close [session]", "close the open session (or a given session id)")
  .description("record a finding, decision, or session")
  .action(
    async (
      kind: string | undefined,
      options: { text?: string; body?: string; about?: string[]; close?: string | boolean },
    ) => {
      await run(async () => {
        const closing =
          options.close === true || options.close === "latest" || typeof options.close === "string";
        const effectiveKind = kind ?? (closing ? "session" : "");
        const result = await runRecord({
          root: root(),
          kind: effectiveKind,
          text: options.text ?? "",
          ...(options.body !== undefined ? { body: options.body } : {}),
          ...(options.about !== undefined ? { about: options.about } : {}),
          ...(closing
            ? { session: typeof options.close === "string" ? options.close : "latest" }
            : {}),
        });
        const human = result.closedSession
          ? `closed session ${result.event.id}`
          : `recorded ${result.event.kind} ${result.event.id}`;
        return { json: result, human };
      });
    },
  );

program
  .command("export")
  .requiredOption("--format <format>", "six-file | handoff | json")
  .option("--out <dir>", "output directory (default: .cto-ai/export)")
  .description("export context as six-file, handoff, or JSON")
  .action(async (options: { format: string; out?: string }) => {
    await run(async () => {
      const format = options.format;
      if (format !== "six-file" && format !== "handoff" && format !== "json") {
        throw new Error(`unknown format "${format}"; use six-file, handoff, or json`);
      }
      const result = await runExport({
        root: root(),
        format,
        ...(options.out !== undefined ? { out: options.out } : {}),
      });
      return {
        json: result,
        human: `exported ${result.format} to ${result.out}:\n${result.files.join("\n")}`,
      };
    });
  });

program
  .command("import")
  .argument("<source>", "path to a six-file folder or a planning transcript")
  .description("import existing context (six-file, specs, planning transcripts)")
  .action(async (source: string) => {
    await run(async () => {
      const result = await runImport({ root: root(), source });
      return {
        json: result,
        human: `imported ${result.imported.length} context file(s), ${result.notes.length} note(s)`,
      };
    });
  });

program
  .command("guards")
  .argument("<path>", "path about to be changed")
  .description("show the rules and invariants that apply to a path")
  .action(async (path: string) => {
    await run(async () => {
      const result = await runGuards({ root: root(), path });
      const lines =
        result.rules.length === 0
          ? [`no guard rules match ${path}`]
          : [
              `${result.rules.length} rule(s) apply to ${path}:`,
              ...result.rules.map((rule) => `  ${rule.pattern} - ${rule.rule} (${rule.source})`),
              ...(result.alsoModified.length > 0
                ? ["", "also modified, and protected:", ...result.alsoModified.map((p) => `  ${p}`)]
                : []),
            ];
      return { json: result, human: lines.join("\n") };
    });
  });

program
  .command("check")
  .option("--ci", "exit non-zero on violations")
  .description("detect drift: modified files that trip a guard rule")
  .action(async (options: { ci?: boolean }) => {
    await run(async () => {
      const result = await runCheck({ root: root(), ...(options.ci === true ? { ci: true } : {}) });
      if (options.ci === true && !result.ok) {
        process.exitCode = 1;
      }
      const human = result.ok
        ? "no guard violations"
        : `${result.violations.length} violation(s):\n${result.violations
            .map((violation) => `  ${violation.pattern} - ${violation.rule}`)
            .join("\n")}`;
      return { json: result, human };
    });
  });

program
  .command("spec")
  .argument("[action]", "list | next | close")
  .argument("[unit]", "unit id for close")
  .option("--skip-verify", "close without running verify commands")
  .description("spec workflow: list units, pick the next, close one")
  .action(
    async (
      action: string | undefined,
      unit: string | undefined,
      options: { skipVerify?: boolean },
    ) => {
      await run(async () => {
        const chosen = action ?? "list";
        if (chosen === "list") {
          const result = await runSpecList({ root: root() });
          const lines = [
            `specs: ${result.progress.done}/${result.progress.total} done (${result.progress.percent}%)`,
            ...result.units.map(
              (spec) =>
                `  ${spec.unit} [${spec.status}] ${spec.title}` +
                (spec.totalTasks > 0
                  ? ` (${spec.totalTasks - spec.openTasks}/${spec.totalTasks} tasks)`
                  : ""),
            ),
          ];
          if (result.next !== null) {
            lines.push("", `next: ${result.next.unit} - ${result.next.title}`);
          }
          return { json: result, human: lines.join("\n") };
        }
        if (chosen === "next") {
          const next = await runSpecNext({ root: root() });
          return {
            json: next,
            human:
              next === null ? "no pending unit" : `${next.unit} - ${next.title} [${next.status}]`,
          };
        }
        if (chosen === "close") {
          if (unit === undefined) {
            throw new Error("`ctoai spec close` needs a unit id, e.g. `ctoai spec close 01`");
          }
          const result = await runSpecClose({
            root: root(),
            unit,
            ...(options.skipVerify === true ? { skipVerify: true } : {}),
          });
          const lines = [
            `unit ${result.unit.unit} ${result.done ? "closed" : "NOT closed (verification failed)"}`,
            ...result.ran.map((entry) => `  $ ${entry.command} -> ${entry.ok ? "ok" : "FAILED"}`),
          ];
          return { json: result, human: lines.join("\n") };
        }
        throw new Error(`unknown spec action "${chosen}"; use list, next, or close`);
      });
    },
  );

program
  .command("connect")
  .option("--url <url>", "redis://host:6379 or rediss://... for FalkorDB Cloud")
  .option("--username <user>", "ACL username")
  .option("--password <pass>", "password (prefer FALKORDB_PASSWORD)")
  .option("--graph <name>", "graph name (default: project name)")
  .option("--backfill", "push the local index into the graph after connecting")
  .description("connect a FalkorDB instance")
  .action(
    async (options: {
      url?: string;
      username?: string;
      password?: string;
      graph?: string;
      backfill?: boolean;
    }) => {
      await run(async () => {
        const result = await runConnect({
          root: root(),
          ...(options.url !== undefined ? { url: options.url } : {}),
          ...(options.username !== undefined ? { username: options.username } : {}),
          ...(options.password !== undefined ? { password: options.password } : {}),
          ...(options.graph !== undefined ? { graph: options.graph } : {}),
          ...(options.backfill === true ? { backfill: true } : {}),
        });
        const lines = [
          result.reachable
            ? `connected to ${result.url} (graph: ${result.graph})`
            : `FAILED to reach ${result.url}`,
          result.version !== null ? `server version: ${result.version}` : "",
          result.backfilled
            ? `backfilled ${result.nodeCount} nodes, ${result.edgeCount} edges`
            : "not backfilled (pass --backfill to push the local index)",
          "credentials stay in FALKORDB_* env vars; config.json stores only the URL and graph name.",
        ].filter((line) => line !== "");
        return { json: result, human: lines.join("\n") };
      });
    },
  );

program
  .command("mcp")
  .description("run the MCP server over stdio")
  .action(async () => {
    try {
      await serveMcp({ root: root(), version: __CTOAI_VERSION__ });
    } catch (error) {
      const ctoai = toCtoaiError(error);
      process.stderr.write(`ctoai: ${ctoai.message}\n`);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const ctoai = toCtoaiError(error);
  process.stderr.write(`ctoai: ${ctoai.message}\n`);
  process.exitCode = 1;
});
