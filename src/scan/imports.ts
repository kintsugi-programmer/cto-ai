/**
 * Deterministic import scanner.
 *
 * A line scanner, not a parser - deliberately. The roadmap upgrades this to
 * real parsers later, behind this same interface, so nothing else changes.
 * Supported: ESM/CJS JavaScript and TypeScript, Python, Go, Rust.
 */

const ESM_IMPORT = /^\s*(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/;
const REQUIRE = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/;
const DYNAMIC_IMPORT = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/;
const PYTHON_FROM = /^\s*from\s+([.\w]+)\s+import\b/;
const PYTHON_IMPORT = /^\s*import\s+([.\w]+)/;
const GO_IMPORT_QUOTED = /^\s*(?:import\s+)?["']([^"']+)["']\s*$/;
const RUST_MOD = /^\s*(?:pub\s+)?mod\s+([A-Za-z_][A-Za-z0-9_]*)\s*;/;
const RUST_USE = /^\s*(?:pub\s+)?use\s+(crate|super|self)::([:\w]+)/;

/** A raw specifier exactly as written in the source. */
export interface ImportRef {
  /** The specifier, e.g. `./utils`, `node:fs`, `requests`. */
  specifier: string;
  /** 1-based line number. */
  line: number;
}

function scanLine(line: string, language: string, refs: ImportRef[], lineNumber: number): void {
  const push = (specifier: string): void => {
    if (specifier.length > 0) {
      refs.push({ specifier, line: lineNumber });
    }
  };

  switch (language) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "mjs":
    case "cjs":
    case "mts":
    case "cts": {
      const esm = ESM_IMPORT.exec(line);
      if (esm?.[1] !== undefined) {
        push(esm[1]);
        return;
      }
      const req = REQUIRE.exec(line);
      if (req?.[1] !== undefined) {
        push(req[1]);
        return;
      }
      const dyn = DYNAMIC_IMPORT.exec(line);
      if (dyn?.[1] !== undefined) {
        push(dyn[1]);
      }
      return;
    }
    case "py": {
      const from = PYTHON_FROM.exec(line);
      if (from?.[1] !== undefined) {
        push(from[1]);
        return;
      }
      const imp = PYTHON_IMPORT.exec(line);
      if (imp?.[1] !== undefined) {
        push(imp[1]);
      }
      return;
    }
    case "go": {
      const go = GO_IMPORT_QUOTED.exec(line);
      if (go?.[1] !== undefined) {
        push(go[1]);
      }
      return;
    }
    case "rs": {
      const mod = RUST_MOD.exec(line);
      if (mod?.[1] !== undefined) {
        push(mod[1]);
        return;
      }
      const use = RUST_USE.exec(line);
      if (use?.[2] !== undefined) {
        push(use[2]);
      }
      return;
    }
    default:
      return;
  }
}

/**
 * Extract import specifiers from source text.
 * Only relative/local specifiers are meaningful for a project graph; callers
 * decide how to resolve them (see `resolveImport`).
 */
export function scanImports(content: string, language: string): ImportRef[] {
  const refs: ImportRef[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) {
      continue;
    }
    // Skip block comments crudely but deterministically.
    if (/^\s*(\/\/|#|\*)/.test(line)) {
      continue;
    }
    scanLine(line, language, refs, i + 1);
  }
  return refs;
}

/** Extensions tried, in order, when resolving a relative import. */
const RESOLVE_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs"];

/**
 * Resolve an import specifier to a project-relative POSIX path, or undefined
 * when it points outside the project (bare package, absolute, http).
 */
export function resolveImport(
  fromPath: string,
  specifier: string,
  knownPaths: Set<string>,
): string | undefined {
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    return undefined;
  }
  const fromDir = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/")) : "";
  const base = specifier.startsWith("/")
    ? specifier.slice(1)
    : fromDir === ""
      ? specifier
      : `${fromDir}/${specifier}`;
  const normalized = normalizeDotSegments(base);
  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = `${normalized}${ext}`;
    if (knownPaths.has(candidate)) {
      return candidate;
    }
    const indexCandidate = `${normalized}/index${ext}`;
    if (knownPaths.has(indexCandidate)) {
      return indexCandidate;
    }
  }
  return undefined;
}

/** Resolve `a/b/../c` to `a/c` without touching the file system. */
export function normalizeDotSegments(path: string): string {
  const out: string[] = [];
  for (const part of path.split("/")) {
    if (part === "." || part === "") {
      continue;
    }
    if (part === "..") {
      if (out.length > 0 && out[out.length - 1] !== "..") {
        out.pop();
      } else {
        out.push("..");
      }
      continue;
    }
    out.push(part);
  }
  return out.join("/");
}
