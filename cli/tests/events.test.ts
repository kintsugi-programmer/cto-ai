import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { CtoaiError, ErrorCodes } from "../src/core/errors";
import { EventSchema, FileEventLog, normalizeAbout } from "../src/core/events";

const tempDirs: string[] = [];

async function tempLog(): Promise<FileEventLog> {
  const dir = await mkdtemp(join(tmpdir(), "ctoai-log-"));
  tempDirs.push(dir);
  return new FileEventLog(dir);
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

const base = {
  text: "we chose the file store",
  body: "longer detail here",
  about: ["file:src/a.ts"],
  createdAt: "2026-10-18T10:00:00.000Z",
};

describe("FileEventLog", () => {
  it("appends an event and reads it back with id and machine filled in", async () => {
    const log = await tempLog();
    const written = await log.append({ kind: "decision", ...base });

    expect(written.id).toMatch(/^decision:2026-10-18T10-00-00-000Z-/);
    expect(written.machine.length).toBeGreaterThan(0);
    expect(EventSchema.parse(written)).toEqual(written);

    const all = await log.all();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(written.id);
  });

  it("persists id and machine to disk so a re-read validates", async () => {
    const log = await tempLog();
    const written = await log.append({ kind: "finding", ...base });

    const raw = await readFile(join(log.dir, "findings", `${written.id}.json`), "utf8");
    const onDisk = JSON.parse(raw) as Record<string, unknown>;
    // Without these on disk, every memory tool would fail on re-parse.
    expect(onDisk.id).toBe(written.id);
    expect(typeof onDisk.machine).toBe("string");
  });

  it("never overwrites: two events in the same millisecond both survive", async () => {
    const log = await tempLog();
    const first = await log.append({ kind: "finding", ...base });
    const second = await log.append({ kind: "finding", ...base });

    expect(first.id).not.toBe(second.id);
    const all = await log.all();
    expect(all).toHaveLength(2);
    expect(new Set(all.map((event) => event.id)).size).toBe(2);
  });

  it("self-heals an event file that predates the id fix", async () => {
    const log = await tempLog();
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(join(log.dir, "decisions"), { recursive: true });
    // The pre-fix shape: no id, no machine.
    await writeFile(
      join(log.dir, "decisions", "decision:legacy-abc.json"),
      `${JSON.stringify({ kind: "decision", text: "legacy", about: [], createdAt: "2026-01-01T00:00:00.000Z" })}\n`,
      "utf8",
    );

    const all = await log.all();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe("decision:legacy-abc");
  });

  it("skips a corrupt file instead of failing every memory read", async () => {
    const log = await tempLog();
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(join(log.dir, "findings"), { recursive: true });
    await writeFile(join(log.dir, "findings", "bad.json"), "{not json", "utf8");

    const written = await log.append({ kind: "finding", ...base });
    const all = await log.all();
    expect(all.map((event) => event.id)).toEqual([written.id]);
  });

  it("returns events oldest first and finds the latest of a kind", async () => {
    const log = await tempLog();
    await log.append({ kind: "session", ...base, createdAt: "2026-10-18T09:00:00.000Z" });
    const newer = await log.append({
      kind: "session",
      ...base,
      createdAt: "2026-10-18T11:00:00.000Z",
    });

    const all = await log.all();
    expect(all.map((event) => event.createdAt)).toEqual([
      "2026-10-18T09:00:00.000Z",
      "2026-10-18T11:00:00.000Z",
    ]);
    expect((await log.latest("session"))?.id).toBe(newer.id);
  });
});

describe("normalizeAbout", () => {
  it("sorts and de-duplicates references", () => {
    expect(normalizeAbout(["file:b.ts", "file:a.ts", "file:a.ts"])).toEqual([
      "file:a.ts",
      "file:b.ts",
    ]);
  });

  it("rejects an empty reference with a stable code", () => {
    try {
      normalizeAbout(["  "]);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(CtoaiError);
      expect((error as CtoaiError).code).toBe(ErrorCodes.INVALID_ARGUMENT);
    }
  });
});
