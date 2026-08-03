import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach, describe, it } from "node:test";
import { build } from "./build-dist.mjs";

/**
 * Tests for the generator.
 *
 * This script is the only real logic in the repo and the last thing between a
 * bad edit and a customer's download. It has already shipped junk twice — a
 * 40KB lockfile, then Astro's .astro cache — both caught by a human happening to
 * read a file list. These are the guards that should have caught them.
 *
 * node:test and node:assert, so the repo stays dependency-free: `node --test`.
 */

const PLACEHOLDER = "__MEMBERSTACK_PUBLIC_KEY__";
const roots = [];

/** A throwaway repo with one valid starter, ready to be broken per-test. */
const makeRepo = () => {
  const root = mkdtempSync(join(tmpdir(), "starters-test-"));
  roots.push(root);
  mkdirSync(join(root, "dist"), { recursive: true });
  addStarter(root, "demo");
  return root;
};

const addStarter = (root, id, overrides = {}) => {
  const dir = join(root, "starters", id);
  mkdirSync(dir, { recursive: true });

  const files = {
    ".env.local": `PUBLIC_KEY=${PLACEHOLDER}\n`,
    "package.json": `{ "name": "${id}" }\n`,
    "app/main.js": "export const x = 1;\n",
    ...overrides.files,
  };
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }

  writeFileSync(
    join(dir, "memberstack.json"),
    JSON.stringify({
      id,
      name: id,
      description: "d",
      envPath: ".env.local",
      envVar: "PUBLIC_KEY",
      sdkFile: "app/main.js",
      ...overrides.meta,
    })
  );
  return dir;
};

const write = (root, id, path, content) => {
  const full = join(root, "starters", id, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
};

/** Every problem string, joined — assertions match against substrings. */
const problemsOf = (root) =>
  build({ startersDir: join(root, "starters"), outDir: root }).problems.join(
    "\n"
  );

after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe("build-dist: what must never ship", () => {
  let root;
  beforeEach(() => {
    root = makeRepo();
  });

  it("accepts a well-formed starter", () => {
    assert.equal(problemsOf(root), "");
  });

  it("refuses a starter with no key placeholder", () => {
    // Without the token the dashboard has nothing to substitute, so the
    // customer downloads a project that installs, builds, runs, and rejects
    // every call with an error naming nothing.
    write(root, "demo", ".env.local", "PUBLIC_KEY=\n");

    assert.match(problemsOf(root), /contains no __MEMBERSTACK_PUBLIC_KEY__/);
  });

  it("refuses a real public key committed by accident", () => {
    // This would be published to every customer who downloads that starter.
    write(
      root,
      "demo",
      "app/main.js",
      'const k = "pk_sb_28795929d37bd1b1787f";\n'
    );

    assert.match(
      problemsOf(root),
      /looks like it contains a REAL Memberstack key/
    );
  });

  it("refuses a declared envVar that appears nowhere", () => {
    // The bug that actually shipped: a Remix page told customers to set
    // NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY, which Remix does not read. Nothing
    // fails at build or runtime — the key is just silently undefined.
    write(
      root,
      "demo",
      "memberstack.json",
      JSON.stringify({
        id: "demo",
        name: "demo",
        description: "d",
        envPath: ".env.local",
        envVar: "TYPO_KEY",
        sdkFile: "app/main.js",
      })
    );

    assert.match(
      problemsOf(root),
      /declares envVar "TYPO_KEY" but no file mentions it/
    );
  });

  it("refuses metadata pointing at files that do not exist", () => {
    // envPath and sdkFile are rendered to the customer as fact — "your key is
    // in X". Naming a file that is not there sends them somewhere empty.
    write(
      root,
      "demo",
      "memberstack.json",
      JSON.stringify({
        id: "demo",
        name: "demo",
        description: "d",
        envPath: ".env.gone",
        envVar: "PUBLIC_KEY",
        sdkFile: "app/missing.js",
      })
    );

    const problems = problemsOf(root);
    assert.match(problems, /envPath ".env.gone" does not exist/);
    assert.match(problems, /sdkFile "app\/missing.js" does not exist/);
  });

  it("refuses a starter with no memberstack.json", () => {
    mkdirSync(join(root, "starters", "orphan"), { recursive: true });

    assert.match(
      problemsOf(root),
      /orphan\/memberstack.json is missing or unreadable/
    );
  });
});

describe("build-dist: what must never be bundled", () => {
  let root;
  beforeEach(() => {
    root = makeRepo();
  });

  const bundledPaths = () => {
    build({ startersDir: join(root, "starters"), outDir: root });
    return JSON.parse(
      readFileSync(join(root, "dist", "demo.json"), "utf8")
    ).files.map((f) => f.path);
  };

  it("skips installed dependencies and framework caches", () => {
    // node_modules would be tens of thousands of files; the caches are the
    // specific mistake that shipped when .astro was missing from the skip list.
    for (const dir of [
      "node_modules",
      ".next",
      ".astro",
      ".svelte-kit",
      ".angular",
      "dist",
    ]) {
      write(root, "demo", `${dir}/junk.js`, "junk\n");
    }

    const paths = bundledPaths();
    assert.deepEqual(
      paths.filter((p) =>
        /node_modules|\.next|\.astro|\.svelte-kit|\.angular|^dist\//.test(p)
      ),
      []
    );
  });

  it("skips lockfiles", () => {
    // They appear the moment anyone runs a starter locally, and dwarf every
    // real file — 40KB against a 1.5KB page.
    write(root, "demo", "package-lock.json", '{"lockfileVersion":3}\n');

    assert.ok(!bundledPaths().includes("package-lock.json"));
  });

  it("does not ship its own metadata file to the customer", () => {
    // memberstack.json is a build input, not part of the project.
    assert.ok(!bundledPaths().includes("memberstack.json"));
  });
});

describe("build-dist: --check", () => {
  let root;
  beforeEach(() => {
    root = makeRepo();
  });

  it("passes when dist matches the sources", () => {
    build({ startersDir: join(root, "starters"), outDir: root });

    const { problems } = build({
      startersDir: join(root, "starters"),
      outDir: root,
      check: true,
    });
    assert.deepEqual(problems, []);
  });

  it("fails when a starter changed and dist was not regenerated", () => {
    // The whole point: an edited starter must not ship behind a stale bundle.
    build({ startersDir: join(root, "starters"), outDir: root });
    write(root, "demo", "app/main.js", "export const x = 2;\n");

    const { problems } = build({
      startersDir: join(root, "starters"),
      outDir: root,
      check: true,
    });
    assert.match(problems.join("\n"), /is stale/);
  });

  it("does not write anything in check mode", () => {
    build({ startersDir: join(root, "starters"), outDir: root });
    const before = readFileSync(join(root, "dist", "demo.json"), "utf8");

    write(root, "demo", "app/main.js", "export const x = 3;\n");
    build({ startersDir: join(root, "starters"), outDir: root, check: true });

    assert.equal(readFileSync(join(root, "dist", "demo.json"), "utf8"), before);
  });
});

describe("build-dist: the manifest", () => {
  it("describes every starter, and only real ones", () => {
    const root = makeRepo();
    addStarter(root, "second");
    build({ startersDir: join(root, "starters"), outDir: root });

    const manifest = JSON.parse(
      readFileSync(join(root, "manifest.json"), "utf8")
    );
    assert.deepEqual(manifest.starters.map((s) => s.id).sort(), [
      "demo",
      "second",
    ]);
    assert.equal(manifest.keyPlaceholder, PLACEHOLDER);
    assert.equal(manifest.schemaVersion, 1);
  });

  it("reports byte counts that match the bundle it emitted", () => {
    // The dashboard shows these to the customer before they download.
    const root = makeRepo();
    build({ startersDir: join(root, "starters"), outDir: root });

    const { starters } = JSON.parse(
      readFileSync(join(root, "manifest.json"), "utf8")
    );
    const bundle = JSON.parse(
      readFileSync(join(root, "dist", "demo.json"), "utf8")
    );
    const entry = starters.find((s) => s.id === "demo");

    assert.equal(entry.fileCount, bundle.files.length);
    assert.equal(
      entry.bytes,
      bundle.files.reduce((n, f) => n + Buffer.byteLength(f.content, "utf8"), 0)
    );
  });
});
