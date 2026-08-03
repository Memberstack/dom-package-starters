#!/usr/bin/env node
/**
 * Regenerates dist/*.json and manifest.json from starters/.
 *
 * Run after editing any starter:  node scripts/build-dist.mjs
 * Check without writing:          node scripts/build-dist.mjs --check
 *
 * The --check mode is what CI runs: it fails if the committed dist differs from
 * what the sources produce, so an edited starter can never ship with a stale
 * bundle behind it.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const STARTERS = join(ROOT, "starters");
const KEY_PLACEHOLDER = "__MEMBERSTACK_PUBLIC_KEY__";
const SCHEMA_VERSION = 1;

/** Never ship build output or installed dependencies. */
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".nuxt",
  ".output",
  ".svelte-kit",
  ".angular",
  ".astro",
  ".vercel",
  ".netlify",
  "dist",
  "build",
  ".git",
  ".cache",
]);

/**
 * Lockfiles are install artifacts, not starter source. They appear the moment
 * anyone runs the starter locally to test it, they dwarf every real file (40KB
 * against a 1.5KB page), and the customer's package manager regenerates one on
 * first install anyway.
 */
const SKIP_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".DS_Store",
]);

/** Metadata lives with the starter, not in this script. */
const META_FILE = "memberstack.json";

const walk = (dir, base = dir) => {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      out.push(...walk(full, base));
    } else {
      if (entry === META_FILE) continue; // build input, not a project file
      if (SKIP_FILES.has(entry)) continue;
      out.push(relative(base, full).split(sep).join("/"));
    }
  }
  return out;
};

/**
 * Generates the bundles, or checks the committed ones are current.
 *
 * Exported and parameterised so the tests can run it against a fixture tree.
 * The guards below are the only thing standing between a bad edit and a
 * customer download, and until this was callable they could not be tested at
 * all — which is how a lockfile and an .astro cache both shipped.
 *
 * Returns { problems, entries }; it neither logs nor exits, so a caller can
 * decide what a failure means.
 */
export const build = ({
  startersDir = STARTERS,
  outDir = ROOT,
  check = false,
} = {}) => {
const problems = [];
const entries = [];
const bundles = new Map();

for (const id of readdirSync(startersDir).sort()) {
  const dir = join(startersDir, id);
  if (!statSync(dir).isDirectory()) continue;

  let meta;
  try {
    meta = JSON.parse(readFileSync(join(dir, META_FILE), "utf8"));
  } catch {
    problems.push(`starters/${id}/${META_FILE} is missing or unreadable`);
    continue;
  }

  const paths = walk(dir);
  const files = paths.map((path) => ({
    path,
    content: readFileSync(join(dir, path), "utf8"),
  }));

  // The whole delivery mechanism depends on the dashboard finding this token
  // and swapping the customer's key in. A starter without it downloads as a
  // project that installs, builds, runs, and rejects every call.
  if (!files.some((f) => f.content.includes(KEY_PLACEHOLDER))) {
    problems.push(`starters/${id} contains no ${KEY_PLACEHOLDER}`);
  }
  // A real key committed by accident would be published to every customer.
  const leaked = files.find((f) => /\bpk_(sb_)?[a-f0-9]{20}\b/.test(f.content));
  if (leaked) {
    problems.push(
      `starters/${id}/${leaked.path} looks like it contains a REAL Memberstack key`
    );
  }
  if (!paths.includes(meta.envPath)) {
    problems.push(`starters/${id}: envPath "${meta.envPath}" does not exist`);
  }
  if (meta.sdkFile && !paths.includes(meta.sdkFile)) {
    problems.push(`starters/${id}: sdkFile "${meta.sdkFile}" does not exist`);
  }
  // The declared env var must actually appear in the starter. This is the guard
  // for a bug that already shipped once: a Remix page told customers to set
  // NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY, which Remix does not read. The name is
  // now declared once in memberstack.json and consumed by the deploy button, so
  // a mismatch here would send every deployer to a variable nothing reads.
  if (!meta.envVar) {
    problems.push(`starters/${id}: memberstack.json has no envVar`);
  } else if (!files.some((f) => f.content.includes(meta.envVar))) {
    problems.push(
      `starters/${id}: declares envVar "${meta.envVar}" but no file mentions it`
    );
  }

  bundles.set(id, { id, files });
  entries.push({
    id: meta.id ?? id,
    name: meta.name,
    description: meta.description,
    envPath: meta.envPath,
    envVar: meta.envVar,
    sdkFile: meta.sdkFile ?? null,
    // Whether this starter can be one-click deployed. Angular needs a build
    // script to turn an env var into its committed environment.ts; everything
    // else reads one natively.
    deployable: meta.deployable !== false,
    bundle: `dist/${id}.json`,
    fileCount: files.length,
    bytes: files.reduce((n, f) => n + Buffer.byteLength(f.content, "utf8"), 0),
  });
}

const manifest = {
  schemaVersion: SCHEMA_VERSION,
  keyPlaceholder: KEY_PLACEHOLDER,
  starters: entries,
};

const targets = [
  [join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`],
  ...[...bundles].map(([id, bundle]) => [
    join(outDir, "dist", `${id}.json`),
    `${JSON.stringify(bundle, null, 2)}\n`,
  ]),
];

for (const [file, content] of targets) {
  if (check) {
    let current = null;
    try {
      current = readFileSync(file, "utf8");
    } catch {}
    if (current !== content) {
      problems.push(
        `${relative(outDir, file)} is stale — run node scripts/build-dist.mjs`
      );
    }
  } else {
    writeFileSync(file, content);
  }
}

  return { problems, entries, count: bundles.size };
};

/**
 * CLI. Only runs when this file is executed directly, so importing it from a
 * test does not write to the real dist/ or call process.exit.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes("--check");
  const { problems, entries, count } = build({ check });

  if (problems.length) {
    console.error("build-dist failed:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.log(
    check
      ? `dist is up to date (${entries.length} starters)`
      : `wrote manifest.json and ${count} bundles`
  );
  for (const entry of entries) {
    console.log(
      `  ${entry.id.padEnd(10)} ${String(entry.fileCount).padStart(3)} files  ${entry.bytes} bytes`
    );
  }
}
