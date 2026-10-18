import { z } from "zod";

import { CtoaiError, ErrorCodes } from "../core/errors";

/**
 * Spec-driven workflow.
 *
 * Every unit gets a spec file before implementation: Goal / Design /
 * Implementation / Dependencies / Verify. `ctoai spec next` returns the
 * topologically next buildable unit; `ctoai spec close NN` runs its verify
 * commands and records the result.
 */

export const SpecStatusSchema = z.enum(["todo", "in-progress", "blocked", "done"]);
export type SpecStatus = z.infer<typeof SpecStatusSchema>;

export interface SpecUnit {
  /** e.g. `01`, from the filename `01-scanner.md` or frontmatter `unit`. */
  unit: string;
  title: string;
  status: SpecStatus;
  /** unit ids this one depends on. */
  dependsOn: string[];
  /** shell commands that prove the unit works. */
  verify: string[];
  /** unchecked checkboxes = remaining work. */
  openTasks: number;
  totalTasks: number;
  file: string;
}

export interface SpecFrontmatter {
  unit?: string;
  title?: string;
  status?: string;
  depends_on?: string[];
  dependsOn?: string[];
  verify?: string | string[];
}

/**
 * Parse one spec file.
 *
 * Frontmatter is read with the `yaml` package when available; a tolerant
 * line-based fallback keeps specs parseable even with hand-written YAML.
 */
export function parseSpec(filename: string, raw: string): SpecUnit {
  const { frontmatter, body } = splitFrontmatter(raw);
  const fm = parseFrontmatterLoose(frontmatter);
  const unit = fm.unit ?? filename.replace(/\.md$/, "").split("-")[0] ?? filename;
  const title = fm.title ?? /^#\s+(.*)$/m.exec(body)?.[1] ?? filename.replace(/\.md$/, "");

  const verifyRaw = fm.verify;
  const verify = Array.isArray(verifyRaw)
    ? verifyRaw
    : typeof verifyRaw === "string" && verifyRaw.trim().length > 0
      ? [verifyRaw]
      : [];

  const dependsOn = (fm.depends_on ?? fm.dependsOn ?? []).filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );

  const boxes = [...body.matchAll(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/gm)];
  const openTasks = boxes.filter((box) => box[1] === " ").length;

  return {
    unit,
    title: title.trim(),
    status: coerceStatus(fm.status),
    dependsOn: [...new Set(dependsOn)].sort(),
    verify,
    openTasks,
    totalTasks: boxes.length,
    file: filename,
  };
}

function coerceStatus(value: string | undefined): SpecStatus {
  if (value === undefined) {
    return "todo";
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "in-progress" || normalized === "in progress" || normalized === "doing") {
    return "in-progress";
  }
  if (normalized === "blocked") {
    return "blocked";
  }
  if (normalized === "done" || normalized === "complete" || normalized === "completed") {
    return "done";
  }
  return "todo";
}

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) {
    return { frontmatter: "", body: raw };
  }
  const end = raw.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: "", body: raw };
  }
  const fm = raw.slice(4, end);
  const bodyStart = raw.indexOf("\n", end + 1);
  return { frontmatter: fm, body: bodyStart === -1 ? "" : raw.slice(bodyStart + 1) };
}

/**
 * Tolerant frontmatter reader.
 *
 * Handles the shapes specs actually use: scalars, inline lists, and block
 * lists. A real YAML parse is attempted first via dynamic import.
 */
function parseFrontmatterLoose(text: string): SpecFrontmatter {
  const out: SpecFrontmatter & Record<string, unknown> = {};
  if (text.trim().length === 0) {
    return out;
  }
  let currentKey = "";
  for (const line of text.split("\n")) {
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem?.[1] !== undefined && currentKey !== "") {
      const existing = out[currentKey as keyof SpecFrontmatter];
      if (Array.isArray(existing)) {
        existing.push(listItem[1].trim().replace(/^["']|["']$/g, ""));
      } else if (existing === undefined) {
        (out as Record<string, unknown>)[currentKey] = [
          listItem[1].trim().replace(/^["']|["']$/g, ""),
        ];
      }
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (kv?.[1] !== undefined) {
      currentKey = kv[1];
      const value = (kv[2] ?? "").trim();
      if (value === "") {
        (out as Record<string, unknown>)[currentKey] = [];
        continue;
      }
      if (value.startsWith("[") && value.endsWith("]")) {
        (out as Record<string, unknown>)[currentKey] = value
          .slice(1, -1)
          .split(",")
          .map((item) => item.trim().replace(/^["']|["']$/g, ""))
          .filter((item) => item.length > 0);
        continue;
      }
      (out as Record<string, unknown>)[currentKey] = value.replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

/**
 * The next buildable unit: lowest unit id among non-done units whose
 * dependencies are all done. Cycles throw rather than hang.
 */
export function specNext(specs: SpecUnit[]): SpecUnit | null {
  assertNoCycles(specs);
  const byUnit = new Map(specs.map((spec) => [spec.unit, spec]));
  const pending = specs
    .filter((spec) => spec.status !== "done")
    .filter((spec) =>
      spec.dependsOn.every((dep) => byUnit.get(dep)?.status === "done" || !byUnit.has(dep)),
    )
    .sort((a, b) => (a.unit < b.unit ? -1 : 1));
  return pending[0] ?? null;
}

/** Detect a dependency cycle among specs; throws with the cycle spelled out. */
export function assertNoCycles(specs: SpecUnit[]): void {
  const byUnit = new Map(specs.map((spec) => [spec.unit, spec]));
  const state = new Map<string, "visiting" | "done">();

  function visit(unit: string, trail: string[]): void {
    const status = state.get(unit);
    if (status === "done") {
      return;
    }
    if (status === "visiting") {
      throw new CtoaiError(
        ErrorCodes.DEPENDENCY_CYCLE,
        `spec dependency cycle: ${[...trail, unit].join(" -> ")}`,
      );
    }
    state.set(unit, "visiting");
    for (const dep of byUnit.get(unit)?.dependsOn ?? []) {
      if (byUnit.has(dep)) {
        visit(dep, [...trail, unit]);
      }
    }
    state.set(unit, "done");
  }

  for (const spec of specs) {
    visit(spec.unit, []);
  }
}

/** Progress summary across all specs. */
export function specProgress(specs: SpecUnit[]): {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  todo: number;
  percent: number;
} {
  const total = specs.length;
  const done = specs.filter((spec) => spec.status === "done").length;
  const inProgress = specs.filter((spec) => spec.status === "in-progress").length;
  const blocked = specs.filter((spec) => spec.status === "blocked").length;
  const todo = specs.filter((spec) => spec.status === "todo").length;
  return {
    total,
    done,
    inProgress,
    blocked,
    todo,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
