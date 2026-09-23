---
name: brainlog
description: Log a decision, incident, staff-work entry, SOP update, client update, or note into the canonical Yielde brain (Yielde-dev/brain) by editing main directly. Use when Chris says "log this", "add to brain", or a session resolved an error / made a decision worth recording.
---

# /brainlog

Writes to the canonical Yielde brain (`Yielde-dev/brain`, published at brain.yielde.dev) using the **direct-update protocol** (effective 2026-09-07, `Decisions/2026-09-07-direct-brain-updates.html`). Intake, Guard and the MacBook are retired; `C:\Users\chris\yielde-brain-intake\` is an archive — never write there.

An explicit request to log or apply a change is the authorization. Announce what landed (path + commit) when done.

## Argument shapes

- `/brainlog` (no args) — infer the entry kind from recent context; state your pick in one line.
- `/brainlog decision | incident | sop-update | client-update | note` — canonical content.
- `/brainlog staff-work` — a dated entry in `brain/staff/{chris|devon|dihan}.html`.

## Where things go

| Kind | Path |
|---|---|
| decision | `Decisions/YYYY-MM-DD-<slug>.html` (new file) |
| incident | `brain/incidents/<slug>-YYYY-MM-DD.html` |
| sop-update | the existing `brain/sops/<name>.html` — edit the relevant section |
| client-update | `brain/clients/<slug>.html` (new clients start from `_template.html`) |
| note | `brain/notes/...` (existing file if one fits, else new) |
| staff-work | `brain/staff/<name>.html` — add a dated entry at the top of the log |

Match an existing sibling file's structure: keep the `yielde:*` head meta (`type`, `slug`, `author`, `owner`, `created`, `updated`, `status`; plus `severity` for incidents, `review-by` for SOPs, `supersedes` for decisions) and one `<article>` with `<section id="...">` children. Stamp times from `date -u`.

## Flow (in `C:\Users\chris\yielde-brain-canonical`)

1. `git pull --ff-only origin main`. If a concurrent session is editing the brain, use a worktree: `git worktree add ..\brain-wt-<slug> main`.
2. Edit the actual file. Preserve existing HTML and unrelated content.
3. `git diff` — review for mistakes and secrets. Stage only the intended files.
4. `git commit -F <msgfile>` (existing signing settings; `-F` avoids PowerShell multiline quoting).
5. `git push origin main`. If rejected: `git fetch`, `git rebase origin/main`, resolve, re-review, retry. **Never force-push.**
6. Verify: `git log origin/main -1 --stat` shows your commit. If the change affects the published site, check brain.yielde.dev too.
7. Undo a shared change with `git revert`, never history rewrites.

## Hard rules

- No secret values (names yes, values no), no `<script>`/`<iframe>`/inline JS, no executable scripts.
- No client politics or PII beyond contact name + email.
- Keep existing directories, links and history. Historical Guard documents describe the retired system — leave them.
- The live board is separate (`Yielde-dev/yielde-board` on `board-data`); don't put board state in the brain.
- Never write to `C:\Users\chris\yielde-brain\` (retired 2026-05-23) or the intake clone.
