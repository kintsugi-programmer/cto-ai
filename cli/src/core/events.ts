import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import { join } from "node:path";

import { z } from "zod";

import { CtoaiError, ErrorCodes } from "./errors";

export const EventKindSchema = z.enum(["session", "finding", "decision"]);
export type EventKind = z.infer<typeof EventKindSchema>;

export const EventSchema = z.object({
  /** Deterministic id: `<kind>:<timestamp>-<machine><n>` */
  id: z.string().min(1),
  kind: EventKindSchema,
  /** One-line human summary. */
  text: z.string().min(1),
  /** Longer body (optional). */
  body: z.string().default(""),
  /** Node ids this event is ABOUT, e.g. ["file:src/cli.ts"]. */
  about: z.array(z.string()).default([]),
  /** ISO 8601, UTC. */
  createdAt: z.string().min(1),
  /** Hostname that wrote it (multi-machine traceability). */
  machine: z.string().default(""),
  /** Session this event belongs to, if any. */
  session: z.string().optional(),
  /** Set when a session event is closed and becomes an Episode. */
  closedAt: z.string().optional(),
});

export type CtoEvent = z.infer<typeof EventSchema>;
/** What callers pass to `append`: defaults filled in by the logger. */
export type CtoEventInput = Omit<z.input<typeof EventSchema>, "id">;

export interface EventLog {
  readonly dir: string;
  append(event: CtoEventInput): Promise<CtoEvent>;
  all(): Promise<CtoEvent[]>;
  latest(kind: EventKind): Promise<CtoEvent | undefined>;
}

/** `2026-10-18T20-10-31Z` - filesystem-safe and sortable. */
export function fileTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function machineId(): string {
  return (
    hostname()
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 12) || "host"
  );
}

/**
 * One JSON file per event, append-only.
 *
 * Never rewrite an existing event file: that is what keeps the log free of
 * git merge conflicts and gives us a full temporal history for free. When two
 * events collide on a timestamp we add a numeric suffix rather than overwrite.
 */
export class FileEventLog implements EventLog {
  constructor(readonly dir: string) {}

  private dirFor(kind: EventKind): string {
    return join(this.dir, `${kind}s`);
  }

  async append(input: CtoEventInput): Promise<CtoEvent> {
    const stamp = fileTimestamp(new Date(input.createdAt));
    const machine = machineId();
    const target = this.dirFor(input.kind);
    await mkdir(target, { recursive: true });

    let sequence = 0;
    let path: string;
    for (;;) {
      const id = `${input.kind}:${stamp}-${machine}${sequence === 0 ? "" : `-${sequence}`}`;
      path = join(target, `${id}.json`);
      try {
        // Write the full validated event: `all()` re-parses these files, so
        // anything missing here (id, machine) would fail validation later.
        const event = EventSchema.parse({ ...input, id, machine });
        await writeFile(path, `${JSON.stringify(event, null, 2)}\n`, {
          encoding: "utf8",
          flag: "wx",
        });
        return event;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
          sequence += 1;
          continue;
        }
        throw error;
      }
    }
  }

  async all(): Promise<CtoEvent[]> {
    const kinds: EventKind[] = ["session", "finding", "decision"];
    const events: CtoEvent[] = [];
    for (const kind of kinds) {
      const dir = this.dirFor(kind);
      let names: string[];
      try {
        names = await readdir(dir);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          continue;
        }
        throw error;
      }
      for (const name of names.filter((n) => n.endsWith(".json")).sort()) {
        const raw = await readFile(join(dir, name), "utf8");
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          // A corrupt file must not take down every memory tool; skip it.
          continue;
        }
        // The filename is the id, so a file missing one (written by an older
        // build, or hand-edited) can still be read without loss.
        const id = name.replace(/\.json$/, "");
        const candidate =
          parsed !== null && typeof parsed === "object"
            ? { machine: id.split("-").pop() ?? "", ...(parsed as object), id }
            : parsed;
        const result = EventSchema.safeParse(candidate);
        if (result.success) {
          events.push(result.data);
        }
      }
    }
    return events.sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
    );
  }

  async latest(kind: EventKind): Promise<CtoEvent | undefined> {
    const events = await this.all();
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (event?.kind === kind) {
        return event;
      }
    }
    return undefined;
  }
}

/** Resolve `--about` refs to node ids; unknown refs throw with a clear code. */
export function normalizeAbout(refs: string[]): string[] {
  const seen = new Set<string>();
  for (const ref of refs) {
    if (ref.trim().length === 0) {
      throw new CtoaiError(ErrorCodes.INVALID_ARGUMENT, `"--about" received an empty reference`);
    }
    seen.add(ref.trim());
  }
  return [...seen].sort();
}
