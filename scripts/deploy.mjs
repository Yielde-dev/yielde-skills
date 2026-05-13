#!/usr/bin/env node
// yielde-skills → ~/.claude/skills/ deploy.
// Walks yielde-skills/skills/ recursively for SKILL.md, then copies each
// containing directory to ~/.claude/skills/<dirname>/ — Claude Code loads
// skills from a flat layout, so any nesting in the source is flattened by
// the leaf directory name.
//
// yielde-skills/ is the source of truth. Deploy is one-way. Re-runs only
// copy a skill if any file in its source tree is newer than the deployed
// copy, so SessionStart is a near-no-op once skills are in sync.
//
// Tracks deployed skills in .deployed.json so it can prune entries that
// disappear from source without touching unrelated skills in ~/.claude/skills/.

import { readdir, stat, mkdir, rm, cp, writeFile, readFile, access } from "node:fs/promises";
import { join, resolve, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SKILLS_SRC = join(REPO_ROOT, "skills");
const CLAUDE_SKILLS = join(homedir(), ".claude", "skills");
const MANIFEST = join(REPO_ROOT, ".deployed.json");

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function walkSkillDirs(dir, out = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkSkillDirs(p, out);
    } else if (entry.name === "SKILL.md") {
      out.push(dirname(p));
    }
  }
  return out;
}

async function maxMtime(dir) {
  let max = 0;
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return 0; }
  for (const entry of entries) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await maxMtime(p);
      if (sub > max) max = sub;
    } else {
      try {
        const m = (await stat(p)).mtimeMs;
        if (m > max) max = m;
      } catch {}
    }
  }
  return max;
}

async function loadManifest() {
  if (!(await exists(MANIFEST))) return { skills: [] };
  try { return JSON.parse(await readFile(MANIFEST, "utf8")); }
  catch { return { skills: [] }; }
}

function toRel(absolutePath) {
  return relative(SKILLS_SRC, absolutePath).replace(/\\/g, "/");
}

async function main() {
  if (!(await exists(SKILLS_SRC))) process.exit(0);
  if (!(await exists(CLAUDE_SKILLS))) await mkdir(CLAUDE_SKILLS, { recursive: true });

  const prev = new Set((await loadManifest()).skills || []);
  const current = new Map();
  const collisions = [];

  for (const srcDir of await walkSkillDirs(SKILLS_SRC)) {
    const name = basename(srcDir);
    if (current.has(name)) {
      collisions.push({ name, first: current.get(name), second: srcDir });
      continue;
    }
    current.set(name, srcDir);
  }

  const created = [];
  const updated = [];

  for (const [skill, srcSkillPath] of current) {
    const destPath = join(CLAUDE_SKILLS, skill);
    if (!(await exists(destPath))) {
      await cp(srcSkillPath, destPath, { recursive: true });
      created.push(skill);
      continue;
    }
    const [srcMtime, destMtime] = await Promise.all([
      maxMtime(srcSkillPath),
      maxMtime(destPath),
    ]);
    if (srcMtime > destMtime) {
      await rm(destPath, { recursive: true, force: true });
      await cp(srcSkillPath, destPath, { recursive: true });
      updated.push(skill);
    }
  }

  const pruned = [];
  for (const skill of prev) {
    if (current.has(skill)) continue;
    const destPath = join(CLAUDE_SKILLS, skill);
    if (await exists(destPath)) {
      await rm(destPath, { recursive: true, force: true });
      pruned.push(skill);
    }
  }

  await writeFile(
    MANIFEST,
    JSON.stringify(
      { skills: [...current.keys()].sort(), updatedAt: new Date().toISOString() },
      null,
      2,
    ) + "\n",
  );

  const changes = created.length + updated.length + pruned.length;
  if (changes === 0 && collisions.length === 0) process.exit(0);
  if (created.length) console.log(`[yielde-skills] deployed: ${created.join(", ")}`);
  if (updated.length) console.log(`[yielde-skills] updated: ${updated.join(", ")}`);
  if (pruned.length) console.log(`[yielde-skills] pruned: ${pruned.join(", ")}`);
  for (const c of collisions) {
    console.error(
      `[yielde-skills] collision: "${c.name}" exists at ${toRel(c.first)} and ${toRel(c.second)} — only the first was deployed.`,
    );
  }
}

main().catch((err) => {
  console.error(`[yielde-skills] deploy failed: ${err?.message || err}`);
  process.exit(0);
});
