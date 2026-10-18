/**
 * Markdown scanning: links, headings, and frontmatter-free section extraction.
 *
 * Used for LINKS_TO edges (wiki-style graph of documents) and for parsing the
 * human-authored context/spec/note files into graph nodes.
 */

export interface MarkdownLink {
  /** Link target exactly as written. */
  target: string;
  /** Anchor text. */
  text: string;
  line: number;
}

export interface MarkdownHeading {
  level: number;
  text: string;
  line: number;
}

const INLINE_LINK = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const REFERENCE_LINK = /^\s*\[[^\]]+\]:\s*(\S+)/;
const HEADING = /^(#{1,6})\s+(.*)$/;

/**
 * Extract local links from markdown.
 * Skips images, absolute URLs, anchors-only links, and mailto links.
 */
export function scanMarkdownLinks(content: string): MarkdownLink[] {
  const links: MarkdownLink[] = [];
  const lines = content.split("\n");
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) {
      continue;
    }
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const ref = REFERENCE_LINK.exec(line);
    if (ref?.[1] !== undefined) {
      push(links, ref[1], ref[1], i + 1);
      continue;
    }
    // Find every inline link on the line, not just the first.
    const pattern = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
    for (const match of line.matchAll(pattern)) {
      const target = match[1];
      if (target !== undefined) {
        push(links, target, match[0], i + 1);
      }
    }
  }
  return links;
}

function push(links: MarkdownLink[], rawTarget: string, text: string, line: number): void {
  const target = rawTarget.trim();
  if (
    target.length === 0 ||
    target.startsWith("#") ||
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("mailto:") ||
    target.startsWith("tel:")
  ) {
    return;
  }
  links.push({ target, text, line });
}

/** Extract headings (both ATX `#` styles). */
export function scanHeadings(content: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const lines = content.split("\n");
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) {
      continue;
    }
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const match = HEADING.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) {
      headings.push({ level: match[1].length, text: match[2].trim(), line: i + 1 });
    }
  }
  return headings;
}

/** Strip a leading YAML frontmatter block, returning [frontmatter, body]. */
export function splitFrontmatter(content: string): [string, string] {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return ["", content];
  }
  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    return ["", content];
  }
  const frontmatter = content.slice(4, end);
  const bodyStart = content.indexOf("\n", end + 1);
  return [frontmatter, bodyStart === -1 ? "" : content.slice(bodyStart + 1)];
}

/**
 * Resolve a relative markdown link target to a project-relative path.
 * Returns undefined for external or unresolvable targets.
 */
export function resolveMarkdownLink(
  fromPath: string,
  target: string,
  knownPaths: Set<string>,
): string | undefined {
  const clean = target.split("#")[0]?.split("?")[0] ?? "";
  if (clean.length === 0 || clean.startsWith("/")) {
    return undefined;
  }
  const fromDir = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/")) : "";
  const joined = fromDir === "" ? clean : `${fromDir}/${clean}`;
  const parts: string[] = [];
  for (const part of joined.split("/")) {
    if (part === "." || part === "") {
      continue;
    }
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  const normalized = parts.join("/");
  if (knownPaths.has(normalized)) {
    return normalized;
  }
  for (const candidate of [`${normalized}.md`, `${normalized}.mdx`, `${normalized}.txt`]) {
    if (knownPaths.has(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export { INLINE_LINK as _INLINE_LINK };
