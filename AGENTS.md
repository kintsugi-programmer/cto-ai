# AGENTS.md

Docs-only repo for the **Graph Hacks: Context for AI Agents** hackathon (FalkorDB). No code, manifests, build, tests, or CI exist here - do not add or hunt for them.

## Layout

- `Documents/guide/` - 13-module beginner course, ordered `00-start-here.md` to `12-resources-map.md`.
- `Documents/Hackathon-resources/` - 38 raw resources: 18 saved web pages (`.mhtml`), 19 webinar transcripts (`.txt`), and `Links.txt`.
- `Documents/ideas/`, `Documents/project-notes/` - scratch folders for the maintainer, each with a placeholder `README.md`.
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

- Commit and push directly to `main` (`git push origin main`). No branches, PRs, or CI in this repo.
