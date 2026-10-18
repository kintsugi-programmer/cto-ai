import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

import ignore from "ignore";

/**
 * One file discovered by the scan, with a stable, human-readable id.
 * Paths are always POSIX-style and relative to the project root.
 */
export interface ScannedFile {
  /** e.g. `file:src/index.ts` */
  id: string;
  /** e.g. `src/index.ts` */
  path: string;
  name: string;
  ext: string;
  /** sha256 of the file contents, hex. */
  hash: string;
  size: number;
  /** Lowercase extension without the dot; "" for extensionless files. */
  language: string;
  /** True when the file is treated as text (scanned for imports/links). */
  text: boolean;
}

const BINARY_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "pdf",
  "zip",
  "gz",
  "tar",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
  "mp3",
  "mp4",
  "mov",
  "avi",
  "webm",
  "wasm",
  "so",
  "dylib",
  "dll",
  "exe",
  "bin",
  "class",
  "jar",
  "pyc",
]);

/** Always-ignored names, on top of .gitignore semantics. */
const ALWAYS_IGNORED = new Set([".git", "node_modules", "dist", "coverage", ".cto-ai"]);

export function isTextExtension(ext: string): boolean {
  return !BINARY_EXTENSIONS.has(ext.toLowerCase().replace(/^\./, ""));
}

async function loadIgnores(root: string, extra: string[]): Promise<ReturnType<typeof ignore>> {
  const ig = ignore();
  ig.add([...ALWAYS_IGNORED]);
  let gitignore = "";
  try {
    gitignore = await readFile(join(root, ".gitignore"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
  ig.add(gitignore);
  ig.add(extra);
  return ig;
}

export function toPosix(path: string): string {
  return path.split(sep).join("/");
}

export interface WalkOptions {
  /** Extra ignore patterns (gitignore syntax) from config.json. */
  ignore?: string[];
}

/**
 * Walk the repository with gitignore semantics.
 *
 * Deterministic: entries are sorted by path at every level, so two scans of
 * an unchanged tree return identical arrays.
 */
export async function walkFiles(root: string, options: WalkOptions = {}): Promise<ScannedFile[]> {
  const ig = await loadIgnores(root, options.ignore ?? []);
  const out: ScannedFile[] = [];

  async function visit(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    const sorted = [...entries].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of sorted) {
      const abs = join(dir, entry.name);
      const rel = toPosix(relative(root, abs));
      if (ig.ignores(rel)) {
        continue;
      }
      if (entry.isDirectory()) {
        await visit(abs);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const info = await stat(abs);
      const dot = entry.name.lastIndexOf(".");
      const ext = dot > 0 ? entry.name.slice(dot + 1) : "";
      const text = isTextExtension(ext);
      let hash = "";
      if (text) {
        const content = await readFile(abs, "utf8");
        hash = createHash("sha256").update(content, "utf8").digest("hex");
      } else {
        const content = await readFile(abs);
        hash = createHash("sha256").update(content).digest("hex");
      }
      out.push({
        id: `file:${rel}`,
        path: rel,
        name: entry.name,
        ext,
        hash,
        size: info.size,
        language: ext.toLowerCase(),
        text,
      });
    }
  }

  await visit(root);
  return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** Directories (unique, sorted) implied by a file list, plus the root. */
export function directoriesOf(files: ScannedFile[]): string[] {
  const dirs = new Set<string>();
  dirs.add("");
  for (const file of files) {
    const parts = file.path.split("/");
    parts.pop();
    let current = "";
    for (const part of parts) {
      current = current === "" ? part : `${current}/${part}`;
      dirs.add(current);
    }
  }
  return [...dirs].sort();
}
