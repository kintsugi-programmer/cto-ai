import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { normalizeDotSegments, resolveImport, scanImports } from "../src/scan/imports";
import {
  resolveMarkdownLink,
  scanHeadings,
  scanMarkdownLinks,
  splitFrontmatter,
} from "../src/scan/markdown";
import { directoriesOf, isTextExtension, type ScannedFile, walkFiles } from "../src/scan/walk";

const tempDirs: string[] = [];

async function tempRepo(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "ctoai-walk-"));
  tempDirs.push(dir);
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    await mkdir(join(full, ".."), { recursive: true });
    await writeFile(full, content, "utf8");
  }
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("walkFiles", () => {
  it("walks deterministically and skips node_modules and .git", async () => {
    const root = await tempRepo({
      "src/a.ts": "export const a = 1;\n",
      "src/b.ts": "export const b = 2;\n",
      "node_modules/pkg/index.js": "module.exports = 1;\n",
      ".git/HEAD": "ref: refs/heads/main\n",
      "README.md": "# hi\n",
    });

    const files = await walkFiles(root);
    expect(files.map((file) => file.path)).toEqual(["README.md", "src/a.ts", "src/b.ts"]);
  });

  it("honors .gitignore", async () => {
    const root = await tempRepo({
      ".gitignore": "dist/\n*.log\n",
      "src/a.ts": "export const a = 1;\n",
      "dist/bundle.js": "var a = 1;\n",
      "debug.log": "noise\n",
    });

    const files = await walkFiles(root);
    expect(files.map((file) => file.path)).toEqual([".gitignore", "src/a.ts"]);
  });

  it("honors extra ignore patterns from config", async () => {
    const root = await tempRepo({
      "src/a.ts": "x\n",
      "generated/gen.ts": "y\n",
    });
    const files = await walkFiles(root, { ignore: ["generated/"] });
    expect(files.map((file) => file.path)).toEqual(["src/a.ts"]);
  });

  it("produces identical output across two walks (determinism)", async () => {
    const root = await tempRepo({ "src/a.ts": "x\n", "docs/b.md": "# b\n" });
    const [first, second] = await Promise.all([walkFiles(root), walkFiles(root)]);
    expect(first).toEqual(second);
    // Also identical when run sequentially, which is how sync uses it.
    expect(await walkFiles(root)).toEqual(first);
  });

  it("hashes content so a changed file gets a different hash", async () => {
    const root = await tempRepo({ "a.ts": "one\n" });
    const before = await walkFiles(root);
    await writeFile(join(root, "a.ts"), "two\n", "utf8");
    const after = await walkFiles(root);
    expect(before[0]?.hash).not.toBe(after[0]?.hash);
  });

  it("marks binaries as non-text but still hashes them", async () => {
    const root = await tempRepo({ "logo.png": "not-really-a-png\n" });
    const files = await walkFiles(root);
    expect(files[0]?.text).toBe(false);
    expect(files[0]?.hash.length).toBe(64);
  });
});

describe("directoriesOf", () => {
  it("returns every ancestor directory plus the root, sorted", () => {
    const files = [{ path: "src/deep/file.ts" }, { path: "docs/readme.md" }] as ScannedFile[];
    expect(directoriesOf(files)).toEqual(["", "docs", "src", "src/deep"]);
  });
});

describe("isTextExtension", () => {
  it("classifies text and binary extensions", () => {
    expect(isTextExtension("ts")).toBe(true);
    expect(isTextExtension("md")).toBe(true);
    expect(isTextExtension("png")).toBe(false);
    expect(isTextExtension("woff2")).toBe(false);
  });
});

describe("scanImports", () => {
  it("finds ESM, CJS, and dynamic imports in TypeScript", () => {
    const source = [
      'import { a } from "./a";',
      'import "./side-effect";',
      'export { b } from "./b";',
      'const c = require("./c");',
      'const d = await import("./d");',
    ].join("\n");
    const refs = scanImports(source, "ts");
    expect(refs.map((ref) => ref.specifier)).toEqual(["./a", "./side-effect", "./b", "./c", "./d"]);
    expect(refs[0]?.line).toBe(1);
  });

  it("finds Python imports including relative ones", () => {
    const source = ["from . import sibling", "from .utils import helper", "import os"].join("\n");
    const refs = scanImports(source, "py");
    expect(refs.map((ref) => ref.specifier)).toEqual([".", ".utils", "os"]);
  });

  it("finds Go quoted imports and Rust mod/use", () => {
    const go = scanImports('import (\n\t"fmt"\n\t"myapp/pkg"\n)', "go");
    expect(go.map((r) => r.specifier)).toEqual(["fmt", "myapp/pkg"]);
    const rust = scanImports("mod engine;\npub use crate::store::FileStore;", "rs");
    expect(rust.map((ref) => ref.specifier)).toEqual(["engine", "store::FileStore"]);
  });

  it("skips comment lines", () => {
    const source = ['// import { x } from "./x";', 'import { y } from "./y";'].join("\n");
    expect(scanImports(source, "ts").map((ref) => ref.specifier)).toEqual(["./y"]);
  });

  it("returns nothing for unsupported languages", () => {
    expect(scanImports("SELECT * FROM t;", "sql")).toEqual([]);
  });
});

describe("resolveImport", () => {
  const known = new Set(["src/index.ts", "src/util.ts", "src/deep/mod.ts", "src/deep/index.ts"]);

  it("resolves a relative specifier against the importing file", () => {
    expect(resolveImport("src/index.ts", "./util", known)).toBe("src/util.ts");
  });

  it("resolves a parent-relative specifier", () => {
    expect(resolveImport("src/deep/mod.ts", "../util", known)).toBe("src/util.ts");
  });

  it("resolves a directory to its index file", () => {
    expect(resolveImport("src/index.ts", "./deep", known)).toBe("src/deep/index.ts");
  });

  it("ignores bare package specifiers and absolute URLs", () => {
    expect(resolveImport("src/index.ts", "react", known)).toBeUndefined();
    expect(resolveImport("src/index.ts", "node:fs", known)).toBeUndefined();
  });

  it("normalizes dot segments without touching the filesystem", () => {
    expect(normalizeDotSegments("a/b/../c/./d")).toBe("a/c/d");
    expect(normalizeDotSegments("./a")).toBe("a");
  });
});

describe("scanMarkdownLinks", () => {
  it("extracts local links and skips images, anchors, and external URLs", () => {
    const content = [
      "# Title",
      "See [setup](./setup.md) and [api](../api/README.md).",
      "![diagram](./pic.png)",
      "Jump to [section](#notes).",
      "External [site](https://example.com/x).",
      "Mail [me](mailto:a@b.c).",
      "",
      "[ref]: ./referred.md",
    ].join("\n");
    const links = scanMarkdownLinks(content);
    expect(links.map((link) => link.target)).toEqual([
      "./setup.md",
      "../api/README.md",
      "./referred.md",
    ]);
  });

  it("ignores links inside fenced code blocks", () => {
    const content = ["before", "```", "[not a link](./fake.md)", "```", "[real](./real.md)"].join(
      "\n",
    );
    expect(scanMarkdownLinks(content).map((link) => link.target)).toEqual(["./real.md"]);
  });

  it("finds every link on one line, not just the first", () => {
    const content = "[a](./a.md) and [b](./b.md) and [c](./c.md)";
    expect(scanMarkdownLinks(content)).toHaveLength(3);
  });
});

describe("scanHeadings", () => {
  it("extracts ATX headings with level and line number", () => {
    const content = ["# One", "## Two", "### Three", "text"].join("\n");
    expect(scanHeadings(content)).toEqual([
      { level: 1, text: "One", line: 1 },
      { level: 2, text: "Two", line: 2 },
      { level: 3, text: "Three", line: 3 },
    ]);
  });

  it("ignores hash characters inside code fences", () => {
    const content = ["# Real", "```", "# Not a heading", "```"].join("\n");
    expect(scanHeadings(content)).toHaveLength(1);
  });
});

describe("splitFrontmatter", () => {
  it("splits frontmatter from body", () => {
    const [fm, body] = splitFrontmatter("---\ntitle: x\n---\n\n# Body\n");
    expect(fm).toBe("title: x");
    expect(body).toBe("\n# Body\n");
  });

  it("returns the whole file as body when there is no frontmatter", () => {
    const [fm, body] = splitFrontmatter("# Just a doc\n");
    expect(fm).toBe("");
    expect(body).toBe("# Just a doc\n");
  });
});

describe("resolveMarkdownLink", () => {
  const known = new Set(["docs/setup.md", "docs/index.md", "README.md"]);

  it("resolves a sibling link", () => {
    expect(resolveMarkdownLink("docs/index.md", "./setup.md", known)).toBe("docs/setup.md");
  });

  it("strips the anchor before resolving", () => {
    expect(resolveMarkdownLink("docs/index.md", "./setup.md#install", known)).toBe("docs/setup.md");
  });

  it("resolves a parent link", () => {
    expect(resolveMarkdownLink("docs/setup.md", "../README.md", known)).toBe("README.md");
  });

  it("returns undefined for an unresolvable target", () => {
    expect(resolveMarkdownLink("docs/index.md", "./missing.md", known)).toBeUndefined();
  });
});
