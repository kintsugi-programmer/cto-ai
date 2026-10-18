import { exec } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import { CtoaiError, ErrorCodes } from "../core/errors";
import { openProject, requireInitialized } from "../project/open";
import { parseSpec, type SpecUnit, specNext, specProgress } from "../spec/workflow";

const run = promisify(exec);

export interface SpecListOptions {
  root: string;
}

export interface SpecListResult {
  units: SpecUnit[];
  progress: ReturnType<typeof specProgress>;
  next: SpecUnit | null;
}

/** `ctoai spec` (no subcommand) - list units and what is next. */
export async function runSpecList(options: SpecListOptions): Promise<SpecListResult> {
  const specs = await loadSpecs(options.root);
  return { units: specs, progress: specProgress(specs), next: specNext(specs) };
}

export interface SpecNextOptions {
  root: string;
}

/** `ctoai spec next` - the topologically next buildable unit. */
export async function runSpecNext(options: SpecNextOptions): Promise<SpecUnit | null> {
  const specs = await loadSpecs(options.root);
  return specNext(specs);
}

export interface SpecCloseOptions {
  root: string;
  unit: string;
  /** Skip running verify commands; just mark done. */
  skipVerify?: boolean;
}

export interface SpecCloseResult {
  unit: SpecUnit;
  ran: Array<{ command: string; ok: boolean; output: string }>;
  done: boolean;
}

/**
 * `ctoai spec close NN` - run the unit's verify commands, record the results
 * as a session event, and mark the spec done.
 *
 * Verify commands run in the project root. A failing command does not throw:
 * it reports `done: false` so the caller sees exactly what broke.
 */
export async function runSpecClose(options: SpecCloseOptions): Promise<SpecCloseResult> {
  const { root } = options;
  requireInitialized(root);
  const specs = await loadSpecs(root);
  const spec = specs.find((candidate) => candidate.unit === options.unit);
  if (spec === undefined) {
    throw new CtoaiError(
      ErrorCodes.SPEC_NOT_FOUND,
      `no spec for unit "${options.unit}"; known units: ${specs.map((s) => s.unit).join(", ") || "(none)"}`,
    );
  }

  const ran: SpecCloseResult["ran"] = [];
  if (options.skipVerify !== true) {
    for (const command of spec.verify) {
      try {
        const { stdout, stderr } = await run(command, { cwd: root, timeout: 300_000 });
        ran.push({ command, ok: true, output: `${stdout}${stderr}`.trim().slice(0, 4000) });
      } catch (error) {
        const err = error as { stdout?: string; stderr?: string; message?: string };
        ran.push({
          command,
          ok: false,
          output: `${err.stdout ?? ""}${err.stderr ?? err.message ?? ""}`.trim().slice(0, 4000),
        });
      }
    }
  }

  const allOk = ran.every((entry) => entry.ok);
  const done = options.skipVerify === true || allOk;

  if (done) {
    await markSpecDone(root, spec);
  }

  // Record the verification as a session event so the log holds the evidence.
  const { events } = await openProject(root);
  await events.append({
    kind: "session",
    text: `spec ${spec.unit} ${done ? "closed" : "failed verification"}: ${spec.title}`,
    body: ran
      .map((entry) => `$ ${entry.command}\n${entry.ok ? "ok" : "FAILED"}\n${entry.output}`)
      .join("\n\n"),
    about: [`spec:${spec.unit}`],
    createdAt: new Date().toISOString(),
    closedAt: new Date().toISOString(),
  });

  return { unit: { ...spec, status: done ? "done" : spec.status }, ran, done };
}

/** Rewrite `status: done` in the spec's frontmatter, preserving everything else. */
async function markSpecDone(root: string, spec: SpecUnit): Promise<void> {
  const path = join(root, ".cto-ai", "specs", spec.file);
  const raw = await readFile(path, "utf8");
  let next: string;
  if (/^status:.*$/m.test(raw)) {
    next = raw.replace(/^status:.*$/m, "status: done");
  } else if (raw.startsWith("---\n")) {
    const end = raw.indexOf("\n---", 4);
    next =
      end === -1 ? `${raw}\nstatus: done\n` : `${raw.slice(0, end)}\nstatus: done${raw.slice(end)}`;
  } else {
    next = `---\nunit: ${spec.unit}\nstatus: done\n---\n\n${raw}`;
  }
  await writeFile(path, next, "utf8");
}

async function loadSpecs(root: string): Promise<SpecUnit[]> {
  const dir = join(root, ".cto-ai", "specs");
  let names: string[];
  try {
    names = (await readdir(dir)).filter((name) => name.endsWith(".md")).sort();
  } catch {
    return [];
  }
  const specs: SpecUnit[] = [];
  for (const name of names) {
    specs.push(parseSpec(name, await readFile(join(dir, name), "utf8")));
  }
  return specs.sort((a, b) => (a.unit < b.unit ? -1 : 1));
}
