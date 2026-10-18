import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { GitInfo } from "./build";

const exec = promisify(execFile);

/**
 * Last-commit metadata per path, used for `lastCommit` / `lastCommitAt`
 * properties and the stale-file health metric.
 *
 * All failures are swallowed: cto-ai must work outside a git repo.
 */
export async function collectGitInfo(root: string, limit = 500): Promise<GitInfo> {
  const commit = new Map<string, string>();
  const date = new Map<string, string>();
  try {
    const { stdout } = await exec(
      "git",
      ["log", `-${limit}`, "--name-only", "--pretty=format:COMMIT %H %cI"],
      { cwd: root, maxBuffer: 16 * 1024 * 1024 },
    );
    let current = "";
    let currentIso = "";
    for (const line of stdout.split("\n")) {
      if (line.startsWith("COMMIT ")) {
        const parts = line.split(" ");
        current = parts[1] ?? "";
        currentIso = parts[2] ?? "";
        continue;
      }
      const path = line.trim();
      if (path.length === 0 || current.length === 0) {
        continue;
      }
      // First (most recent) commit wins.
      if (!commit.has(path)) {
        commit.set(path, current);
        date.set(path, currentIso);
      }
    }
  } catch {
    // Not a git repository, or git is unavailable.
  }
  return { commit, date };
}
