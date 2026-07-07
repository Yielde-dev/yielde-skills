---
name: grace
description: Build and land changes so they merge cleanly AFTER other concurrent sessions merge theirs — isolated worktree lane, conflict-minimal diff, rebase-before-land, zero disruption to sibling lanes. Use when Chris says /grace, or mentions parallel/multiple sessions on a repo ("merge after my other session", "don't disrupt the other lane", "don't lose progress", "I have other sessions running"), or when sessions.json shows another active session scoped to the same repo you are about to modify.
version: 1.0.0
author: "Chris (Yielde)"
license: MIT
platforms: [windows]
tags: [yielde, git, worktree, parallel-sessions, merge-safety]
related_skills: [verify]
requires_tools: [Bash, Read, Grep]
provenance: yielde-native
pinned: true
when_to_use: |
  Any build task on a repo where another Claude session (or Chris/Devon by hand) may
  hold in-flight work. Default ON for yielde-site and yielde-platform — multiple lanes
  are the norm there.
when_not_to_use: |
  Solo work on a repo with no other active lanes (verify via Phase 0, don't assume).
  Non-git work. The brain intake pipeline (Guard already serializes merges there).
---

# /grace — build so it lands cleanly after other lanes merge

Invocation: `/grace <task>` runs the task under this protocol; bare `/grace` arms the
protocol for every build in the rest of the session. Announce the lane (branch +
worktree path) as soon as it exists so Chris can track it.

## The contract

1. **Own lane.** All work happens in a worktree + branch you created off `origin/main`.
   Nothing you do moves another session's HEAD, branch, stash, or working tree.
2. **Conflict-minimal diff.** Additive first, surgical hunks, no drive-by refactors.
3. **You absorb the merge burden.** Before landing, rebase onto latest `origin/main`
   and re-verify. Their lane never has to move because of yours.
4. **Park, don't lose.** If you can't land safely, push the branch and hand Chris the
   lane (branch, worktree path, what's left) — never leave work only in a working tree.

## Phase 0 — Recon the other lanes

- `~/.claude/os/sessions.json` — which sessions are active and their scopes.
- In the target repo: `git fetch origin`, then `git worktree list`, `git branch -vv`,
  `gh pr list --state open` — enumerate every in-flight lane.
- Build a collision map: `git diff --name-only origin/main...<branch>` per active
  branch (use origin/remote refs — the shared tree's HEAD is unreliable). Files that
  appear in more than one lane are **hot files**; plan around them.

## Phase 1 — Isolate

- Never build in the shared clone, even if it "looks free" — a sibling session can
  `checkout` under you mid-task and your commits leak onto their branch.
- `git worktree add C:/Users/chris/<repo>-<slug> -b <branch> origin/main`
  — branch **off origin/main**, not local main (local main may be stale or moved).
- Fresh worktrees have no deps: yielde-site worktrees need their own `bun install`.
- Push by name — `git push -u origin <branch>` — it works no matter what the shared
  tree has checked out.

## Phase 2 — Build conflict-minimal

- **Additive first**: new files/modules/components over edits to shared hubs.
- **Shared-file edits**: smallest possible hunks. No reformatting, no import
  reordering, no renaming/moving files another lane touches.
- **No drive-by refactors** — a refactor in a parallel lane is a conflict bomb.
  Note it for a later solo lane instead.
- **Migrations**: number against the max across ALL open lanes' migration dirs, not
  just main's. If two lanes both add migrations, flag it to Chris before landing.
- **Lockfile / generated files / barrel-index files**: touch only when essential,
  keep to the minimal hunk, and name them in the PR body as known conflict surfaces.

## Phase 3 — Land gracefully

- `git fetch origin && git rebase origin/main` in YOUR worktree. Resolve conflicts on
  your side. If a landed lane touched files you changed, re-run `/verify` on your flow
  after the rebase — a clean rebase is not proof the behavior still composes.
- Force-push only your own branch, only `--force-with-lease`. Shared branches are
  never force-pushed (OS hard gate backs this).
- PR body lists the hot/shared files you touched, so whichever lane merges after you
  knows its collision surfaces up front.
- yielde-site gotcha: CI is chronically red (vitest worker OOM) — the Vercel commit
  status is the merge gate, not Actions.
- **Prod has one door** (operating standard rule 4): re-check other lanes' state
  immediately before any deploy or prod-affecting push.

## Phase 4 — Hand off or clean up

- Chris merging later: push the branch, leave the worktree intact, and report
  `branch · worktree path · what's verified · what's left` in one line.
- After your lane lands: `git worktree remove <path>` for your own worktree only.
  Branch deletion is hard-gated — leave it to Chris or ask.

## Never (disruption blacklist)

- Never `checkout` / `switch` / `reset` / `stash` / `clean` in a working tree you did
  not create this session.
- Never commit to, reset, rebase, or push onto a branch another session may own.
  Prefer `git branch -f` over `reset` when moving a ref — it fails safe if checked out.
- Never "helpfully" fix another lane's conflicts by pushing to their branch.
- VPS `/opt/yielde` is dirty by design (live Documenso) — never stash/reset there.

## Recovery — commit leaked onto another lane's branch

It happens when Phase 1 was skipped: worktree add a clean branch off `origin/main`,
`git cherry-pick <sha>` (add `-c core.hooksPath=/dev/null` if no node_modules yet),
push the new branch by name. Never reset the polluted branch — the other session may
have uncommitted work sitting on it.
