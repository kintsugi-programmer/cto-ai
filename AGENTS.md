# AGENTS.md

Repo for the **Graph Hacks: Context for AI Agents** hackathon (FalkorDB) and for **`ctoai`**, the CLI built from this work. Docs live at the root and in `Documents/`; all code, manifests, build, and tests are confined to `cli/` - do not add them anywhere else. There is no CI.

## Layout

- `Documents/guide/` - 16-module beginner course, ordered `00-start-here.md` to `15-building-from-scratch.md`.
- `Documents/Hackathon-resources/` - 43 raw resources: 22 saved web pages (`.mhtml`), 20 transcripts (`.txt`), and `Links.txt`.
- `Documents/Hackathon-resources/automated-notes/` - processed detailed notes, one per resource (43 notes plus a `README.md` index); each links its source file, related notes, and guide modules; the 3 duplicate transcripts are stub notes.
- `Documents/project-notes/` - scratch folder for the maintainer; holds the finalized cto-ai product review (`2026-10-18-cto-ai-product-review.md`), the file-system-first build roadmap (`2026-10-18-cto-ai-implementation-roadmap.md`), and future working notes. `cli/` tracks the roadmap's phases and units.
- `cli/` - the `cto-ai` npm package (binary `ctoai`; TypeScript CLI: source, tests, build). Only this folder may contain code, manifests, or build output.
- Directory names have no trailing spaces. Old commits contain `Documents ` / `Hackathon-resources ` with trailing spaces - do not reuse those names.
- Resource filenames contain spaces, `&`, and one emoji (🌟). Always quote paths.

## Guide writing contract

The maintainer set strict rules for `Documents/guide/*.md`. Match them exactly when editing or adding a module.

- Exactly one `#` H1, then a few relevant `##` headings.
- Nested `-` bullets only. No numbered lists, no `*` bullets.
- `**bold**` for section labels and key terms.
- Fenced code blocks for every code, command, or formula.
- Plain English, short sentences. Files run ~370-690 words (2-3 minute read, roughly 60% bullets).
- Every file includes at least one topic-relevant Mermaid diagram.
- When distilling resources, drop speaker names and filler but keep every fact, definition, number, and step. Verify numbers against `Hackathon-resources/` before changing them.

## Keep in sync

These duplicate each other; update every location when the file set or module list changes.

- `README.md` - module list, resource list, and a generated TOC between `<!-- TOC -->` and `<!-- /TOC -->` markers.
- `guide/00-start-here.md` - reading order.
- `guide/12-resources-map.md` - tree, Mermaid folder map, and hardcoded per-category counts.
- `AGENTS.md` (this file) - the counts above.

## Reading `.mhtml` resources

`.mhtml` files are MIME archives with quoted-printable encoding, so raw `cat` output is unreadable (`=3D`, split lines, etc.). Decode with Python:

```python
import email
from email import policy
msg = email.message_from_bytes(open(path, "rb").read(), policy=policy.default)
html = next(p.get_content() for p in msg.walk() if p.get_content_type() == "text/html")
```

- `Transcript*.txt` files are single-line YouTube transcripts. Three exact duplicate pairs exist (`copy` = `copy 4`, `copy 2` = `copy 5`, `copy 6` = `copy 18`) - run `md5` before treating two as distinct sources.

## Validating Mermaid

GitHub renders Mermaid in Markdown. Check diagrams through mermaid.ink before committing: HTTP 400 means a syntax error, HTTP 200 returns a valid PNG.

```bash
python3 - <<'PY'
import base64, urllib.request
code = open("diagram.mmd").read()  # paste one fenced diagram here
url = "https://mermaid.ink/img/" + base64.urlsafe_b64encode(code.encode()).decode().rstrip("=") + "?type=png"
print(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "curl/8"}), timeout=30).status)
PY
```

## Workflow

- Commit and push directly to `main` (`git push origin main`). No branches, PRs, or CI in this repo. For `cli/` changes, run `npm run verify` in `cli/` before committing.
