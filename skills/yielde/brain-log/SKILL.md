---
name: brain-log
description: Log a decision, incident, staff-work entry, SOP update, client update, or note into the canonical Yielde brain (Yielde-dev/brain) via the intake→Guard pipeline. Use when Chris says "log this", "add to brain", or a session resolved an error / made a decision worth recording.
---

# /brain-log

Writes to the canonical Yielde brain (`Yielde-dev/brain`, published at brain.yielde.dev). **Every write goes through the intake worktree — never touch `main`.** Guard reviews and lands each file. Always Chris-in-the-loop: show the proposed content before pushing.

Full Guard contract: read `C:\Users\chris\yielde-brain-canonical\CLAUDE.md` before your first push of the session.

## Argument shapes

- `/brain-log` (no args) — infer the entry kind from recent context; confirm with Chris.
- `/brain-log decision | incident | sop-update | client-update | note` — a proposal into canonical content.
- `/brain-log staff-work` — a short cofounder log entry (brain-log/ lane).
- `/brain-log delegation <claim|decline|reassign|done> <item-id>` — delegation action.

## Flow

1. **Pull first**: `git -C C:\Users\chris\yielde-brain-canonical pull origin main`.
2. **Pick the lane** (all under `C:\Users\chris\yielde-brain-intake\`):
   - `proposals/` — decisions, SOPs, incidents, notes, client/staff records. Filename `YYYY-MM-DD-<slug>.html` with a **fresh slug every push** (Guard has a prior-rejection confusion bug on reused slugs). Needs `yielde:target` (canonical destination path).
   - `brain-log/` — short cofounder log entries. Filename **exactly** `YYYY-MM-DD-{chris|dihan|devon}.html` — no topic suffix; topic goes in `yielde:slug` or the body.
   - `delegation-action/` — action files against a delegation item-id (current ids in `/delegation/_state.html`).
3. **Head meta (required)**: `yielde:type`, `yielde:slug`, `yielde:author`, `yielde:owner`, `yielde:created`, `yielde:updated`, `yielde:status`. Type extras: `incident`+`severity`, `sop`+`review-by`, `decision`+`supersedes` (when applicable).
   - **Type gotchas (Guard rejects otherwise):** files in `brain-log/` use `yielde:type=brain-log` (NOT `staff-log`). Files in `proposals/` must NOT use `type=brain-log` — reference notes are `type=note` targeting `brain/notes/...`.
   - **Timestamp gotcha:** stamp `yielde:created` from `date -u` (ISO 8601 UTC). Guard rejects future timestamps and anything older than 48 h at review time.
4. **Body**: one `<article>` with `<section id="...">` children — the section is the merge boundary. To update an existing canonical file use **replace-section-by-id**: exactly one `<section>` whose `id` matches an existing section.
5. **Show Chris the content**, then commit (signed — already configured) and push:
   ```powershell
   cd C:\Users\chris\yielde-brain-intake
   git add <lane>\<file>.html
   git commit -m "<short reason>"
   git push origin intake
   ```
6. **Verify the land**: wait ~60–120 s, `git -C C:\Users\chris\yielde-brain-canonical pull origin main`, confirm the file at its target path. If missing, read `rejections/<date>-<slug>.html` for Guard's fix instructions. After a Guard outage, a replace-section push can silently not land — re-push with a fresh slug.
7. **One file at a time.** Confirm each lands before pushing the next. Never batch.

## Hard refusals (fast-path, no model call)

`<script>`/`<iframe>`/inline JS; AWS/Stripe/Paystack/GitHub/OpenAI/JWT/SSH/PGP key patterns; unsigned or unknown-key commits; files >50 KB; stale `yielde:created`.

## Hard rules

- Never log secret values (names yes, values no).
- Never log client politics or PII beyond contact name + email.
- Never write to `C:\Users\chris\yielde-brain\` — that markdown brain was retired 2026-05-23.
