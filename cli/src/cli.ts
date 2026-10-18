#!/usr/bin/env node
import { Command } from "commander";

declare const __CTOAI_VERSION__: string;

const notImplemented = (label: string): void => {
  process.stderr.write(`ctoai: "${label}" is not implemented in 0.0.1 (scaffold).\n`);
  process.exitCode = 1;
};

const program = new Command()
  .name("ctoai")
  .description(
    "The persistent project brain for any coding agent. File-first, graph-powered, MCP-native.",
  )
  .version(__CTOAI_VERSION__);

program
  .command("init")
  .description("scan the repository and set up the .cto-ai context folder")
  .action(() => notImplemented("init"));

program
  .command("sync")
  .description("rebuild the project index incrementally")
  .action(() => notImplemented("sync"));

program
  .command("status")
  .description("show context coverage and health")
  .action(() => notImplemented("status"));

program
  .command("resume")
  .description("restore full project context in one call")
  .action(() => notImplemented("resume"));

program
  .command("query")
  .argument("<tool>", "tool name, e.g. blast_radius, why_connected, load_bearing")
  .description("run a context tool against the project graph")
  .action(() => notImplemented("query"));

program
  .command("record")
  .description("record a finding, decision, or session")
  .action(() => notImplemented("record"));

program
  .command("export")
  .description("export context as six-file, handoff, or JSON")
  .action(() => notImplemented("export"));

program
  .command("import")
  .description("import existing context (six-file, specs, planning transcripts)")
  .action(() => notImplemented("import"));

program
  .command("guards")
  .argument("<path>", "path about to be changed")
  .description("show the rules and invariants that apply to a path")
  .action(() => notImplemented("guards"));

program
  .command("spec")
  .description("spec workflow: next unit, close unit")
  .action(() => notImplemented("spec"));

program
  .command("mcp")
  .description("run the MCP server over stdio")
  .action(() => notImplemented("mcp"));

program
  .command("connect")
  .description("connect a FalkorDB instance")
  .action(() => notImplemented("connect"));

program.parseAsync(process.argv).catch((error: unknown) => {
  process.stderr.write(`ctoai: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
