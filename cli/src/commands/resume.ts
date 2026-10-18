import { openProject, requireInitialized } from "../project/open";
import { parseSpec, type SpecUnit, specNext } from "../spec/workflow";

export interface ResumeOptions {
  root: string;
  limit?: number;
}

export interface ResumeResult {
  project: string;
  /** What to do next, in order. */
  nextUp: string[];
  /** Active spec unit, if a build plan exists. */
  activeUnit: SpecUnit | null;
  /** Last closed session. */
  lastSession: { id: string; text: string; createdAt: string } | null;
  /** Recent decisions, newest first. */
  recentDecisions: Array<{ id: string; text: string; createdAt: string }>;
  /** Open findings, newest first. */
  recentFindings: Array<{ id: string; text: string; createdAt: string }>;
  /** Things that reference nothing in the graph (worth a look). */
  openQuestions: string[];
  /** Context files present. */
  contextFiles: string[];
}

/**
 * `ctoai resume` - restore full project context in one call.
 *
 * This is the answer to "what is going on here?" that an agent asks before
 * touching a repo. Everything comes from the append-only log plus the specs,
 * so deleting index/ and re-running sync loses nothing.
 */
export async function runResume(options: ResumeOptions): Promise<ResumeResult> {
  const { root } = options;
  const limit = options.limit ?? 10;
  requireInitialized(root);
  const { paths, config, store, events } = await openProject(root);
  try {
    const [snapshot, all, contextFiles, specs] = await Promise.all([
      store.load(),
      events.all(),
      readDirNames(paths.context),
      readSpecs(paths.specs),
    ]);

    const sessions = all
      .filter((event) => event.kind === "session")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    // Closing appends a copy referencing the original via `session`, so an
    // original is open only while nothing references it as closed.
    const closedRefs = new Set(
      sessions
        .filter((event) => event.closedAt !== undefined)
        .map((event) => event.session)
        .filter((ref): ref is string => ref !== undefined),
    );
    const lastClosed =
      [...sessions].find((event) => event.closedAt !== undefined && event.session !== undefined) ??
      null;
    const openSession =
      sessions.find((event) => event.closedAt === undefined && !closedRefs.has(event.id)) ?? null;

    const decisions = all
      .filter((event) => event.kind === "decision")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
    const findings = all
      .filter((event) => event.kind === "finding")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);

    const activeUnit = specNext(specs);

    const nextUp: string[] = [];
    if (activeUnit !== null) {
      nextUp.push(`Unit ${activeUnit.unit} (${activeUnit.status}): ${activeUnit.title}`);
    }
    if (openSession !== null) {
      nextUp.push(`Open session in progress: ${openSession.text}`);
    }
    if (decisions.length > 0 && decisions[0] !== undefined) {
      nextUp.push(`Last decision: ${decisions[0].text}`);
    }
    if (nextUp.length === 0) {
      nextUp.push("No build plan or recorded work yet - run `ctoai spec` or record a session.");
    }

    // Findings that point at nothing in the graph are honest open questions.
    const nodeIds = new Set(snapshot.nodes.map((node) => node.id));
    const openQuestions: string[] = [];
    for (const finding of findings) {
      for (const ref of finding.about) {
        if (!nodeIds.has(ref) && !ref.startsWith("file:") && !ref.startsWith("note:")) {
          openQuestions.push(`${finding.id} -> ${ref}`);
        }
      }
    }

    return {
      project: config.name,
      nextUp,
      activeUnit,
      lastSession:
        lastClosed === null
          ? null
          : { id: lastClosed.id, text: lastClosed.text, createdAt: lastClosed.createdAt },
      recentDecisions: decisions.map((event) => ({
        id: event.id,
        text: event.text,
        createdAt: event.createdAt,
      })),
      recentFindings: findings.map((event) => ({
        id: event.id,
        text: event.text,
        createdAt: event.createdAt,
      })),
      openQuestions: openQuestions.slice(0, limit),
      contextFiles,
    };
  } finally {
    await store.close();
  }
}

async function readDirNames(dir: string): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  try {
    return (await readdir(dir)).filter((name) => name.endsWith(".md")).sort();
  } catch {
    return [];
  }
}

async function readSpecs(dir: string): Promise<SpecUnit[]> {
  const { readdir, readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  let names: string[] = [];
  try {
    names = (await readdir(dir)).filter((name) => name.endsWith(".md")).sort();
  } catch {
    return [];
  }
  const specs: SpecUnit[] = [];
  for (const name of names) {
    try {
      const raw = await readFile(join(dir, name), "utf8");
      specs.push(parseSpec(name, raw));
    } catch {
      // Skip unreadable specs; `ctoai status` will surface them.
    }
  }
  return specs;
}
