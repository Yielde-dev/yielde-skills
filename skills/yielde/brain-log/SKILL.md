---
name: brain-log
description: Add or promote an entry in the Yielde second brain at yielde-brain/. Use when Chris wants to record a decision, incident, staff contribution, SOP update, client update, or promote a Stop-hook draft from _inbox/ into its proper folder.
---

# /brain-log

Yielde second brain logger. **Always Chris-in-the-loop — never write silently.**

The brain is the git-backed shared vault at `C:\Users\chris\yielde-brain\` (cloned per co-founder; path differs on Devon's / Lyell's machine). The local Obsidian vault at `C:\Users\chris\ObsidianVault\Vault\Yielde\` is **not** the canonical source — it lags the git repo and is read-only from this skill's perspective.

## When to use

- Chris said "log this" / "remember this" / "add to brain" about Yielde work.
- A decision was just made and needs filing.
- An error was just resolved and the symptom→fix is worth recording.
- Lyell or Devon shipped something Chris wants tracked.
- A Stop-hook draft sits in `_inbox/` and needs review + promotion.

## Argument shapes

`/brain-log` (no args) — ask Chris what kind of entry.
`/brain-log decision`
`/brain-log incident`
`/brain-log staff-work`
`/brain-log sop-update`
`/brain-log client-update`
`/brain-log promote <inbox-filename>`

## Flow

1. **Confirm scope.** Ask Chris one or two sharpening questions if the entry isn't obvious from recent context (which client? which co-founder? which SOP? what was the symptom?).
2. **Pick the right file path** (all under `C:\Users\chris\yielde-brain\`):
   - decision → `Decisions/YYYY-MM-DD-<slug>.md`
   - incident → `Incidents/<slug>.md`
   - staff-work → append to `Staff/<name>.md` "Contributions log" section
   - sop-update → edit existing `SOPs/<name>.md`, bump `updated:` frontmatter
   - client-update → edit `Clients/<slug>.md`
   - promote → read `_inbox/<filename>`, classify, then run the matching flow above; delete the inbox file when done.
3. **Use the right template.** `_template.md` files exist in `Decisions/`, `Incidents/`, `Staff/`, `Clients/`. Copy structure exactly.
4. **Write the file.** Show Chris the proposed content first if it's a decision/incident — those are load-bearing. Staff-log appends and SOP edits can usually go straight in.
5. **Update the index.** `Decisions/_index.md`, `Incidents/_index.md`, `Clients/_index.md` get a new row. Most recent first.
6. **Mirror to platform docs if applicable.** Platform-locked decisions also go in `yielde-platform/docs/decisions.md` (source of truth on conflict).
7. **Run `/brain-sync`** to commit and push so co-founders receive the update. yielde-brain is git-backed; an entry written but not pushed is invisible to Devon and Lyell.
8. **Tell Chris what was written and where.**

## Hard rules

- Never log secrets, virtual keys, `WEBHOOK_SIGNING_SECRET`, or `N8N_ENCRYPTION_KEY` values. Names yes, values no.
- Never log internal client politics or PII beyond contact name + email.
- Never auto-promote `_inbox/` drafts. Always require explicit `/brain-log promote <file>` or manual move.
- Never write into `AI-Organization-*` folders, `Personal/`, or `Vault/Projects/Yielde-System/` — those are out of trust scope.
- Never write to the local Obsidian vault (`ObsidianVault/Vault/Yielde/`). It's a stale working copy, not the canonical brain.

## Done when

File exists in `yielde-brain/`, index updated (if applicable), platform-doc mirror done (if applicable), `/brain-sync` ran cleanly with commit pushed, Chris confirmed.
