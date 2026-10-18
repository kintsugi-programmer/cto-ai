import { collectGitInfo } from "../index/git";
import { openProject, requireInitialized } from "../project/open";
import { matchesGlob } from "../tools/catalog";
import { type GuardRule, loadGuardsFromContext } from "../tools/resolve";

export interface GuardsOptions {
  root: string;
  path: string;
}

export interface GuardsResult {
  path: string;
  rules: GuardRule[];
  /** Paths matching the same rules that git reports as modified. */
  alsoModified: string[];
  safe: boolean;
}

/** `ctoai guards <path>` - what protects this path, and what else it touches. */
export async function runGuards(options: GuardsOptions): Promise<GuardsResult> {
  const { root, path } = options;
  requireInitialized(root);
  await openProject(root);

  const rules = await loadGuardsFromContext(root);
  const applicable = rules.filter((rule) => matchesGlob(path, rule.pattern));

  // Anything else modified in git that trips the same rules is worth flagging:
  // a change to a protected path usually drags its neighbours along.
  const git = await collectGitInfo(root, 100);
  const alsoModified: string[] = [];
  for (const modified of git.commit.keys()) {
    if (modified === path) {
      continue;
    }
    if (rules.some((rule) => matchesGlob(modified, rule.pattern))) {
      alsoModified.push(modified);
    }
  }

  return {
    path,
    rules: applicable,
    alsoModified: alsoModified.sort(),
    safe: applicable.length === 0,
  };
}

export interface CheckOptions {
  root: string;
  /** When true, a violation exits non-zero (for CI). */
  ci?: boolean;
}

export interface CheckResult {
  violations: Array<{ rule: string; pattern: string; source: string }>;
  ok: boolean;
}

/**
 * `ctoai check` - drift detection: modified files that trip a guard rule.
 *
 * Reads what git says is dirty rather than the index, so it catches work in
 * progress before it is committed.
 */
export async function runCheck(options: CheckOptions): Promise<CheckResult> {
  const { root } = options;
  requireInitialized(root);
  await openProject(root);

  const rules = await loadGuardsFromContext(root);
  const modified = await modifiedPaths(root);

  const violations: CheckResult["violations"] = [];
  for (const path of modified) {
    for (const rule of rules) {
      if (matchesGlob(path, rule.pattern)) {
        violations.push({ rule: rule.rule, pattern: rule.pattern, source: rule.source });
      }
    }
  }

  // De-duplicate on the (rule, pattern) pair.
  const seen = new Set<string>();
  const deduped = violations.filter((violation) => {
    const key = `${violation.pattern}|${violation.rule}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return {
    violations: deduped.sort((a, b) => (a.pattern < b.pattern ? -1 : 1)),
    ok: deduped.length === 0,
  };
}

async function modifiedPaths(root: string): Promise<string[]> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const exec = promisify(execFile);
  try {
    // -uall: list every untracked file instead of collapsing a dirty folder
    // into one line, otherwise a violation inside .cto-ai/ hides behind it.
    const { stdout } = await exec("git", ["status", "--porcelain", "-uall"], { cwd: root });
    return stdout
      .split("\n")
      .map((line) => line.slice(3).trim())
      .filter((path) => path.length > 0 && !path.includes(" -> "))
      .map((path) => path.replace(/^"|"$/g, ""));
  } catch {
    return [];
  }
}
