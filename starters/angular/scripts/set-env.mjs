#!/usr/bin/env node
/**
 * Lets a host set the Memberstack key by environment variable.
 *
 * Angular has no `.env` support: `environment.ts` is a TypeScript file that gets
 * compiled into the bundle. That is fine when you own the machine and can edit
 * the file, and it is why the other five starters read an env var while this one
 * does not.
 *
 * It stops being fine the moment someone deploys from a Git repo — Vercel,
 * Netlify, Cloud Build, anything. There is no file to edit, only environment
 * variables, and without this the deployed site ships whatever key happens to be
 * committed.
 *
 * So: if NG_APP_MEMBERSTACK_PUBLIC_KEY is set, this writes it into
 * environment.ts before the build. If it is NOT set, this does nothing at all
 * and the committed file is used exactly as before.
 *
 * That "does nothing" branch is load-bearing. It means the README's instruction
 * — put your Live key in environment.ts — stays true for everyone building
 * locally, and nobody's edit is silently overwritten by a blank variable.
 *
 * The NG_APP_ prefix follows the convention @ngx-env/builder established, so it
 * reads as an Angular browser-facing variable rather than a server secret.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * EVERY environment file, not just environment.ts.
 *
 * Angular picks the file by build configuration: `ng build` defaults to
 * production and reads environment.ts, while `ng serve` defaults to development
 * and `fileReplacements` swaps in environment.development.ts. Writing only the
 * first meant setting the variable fixed the deployed site and left `npm run
 * dev` authenticating with the literal placeholder -- every call rejected with
 * "The provided public key is invalid", on the one path a developer uses while
 * building. Found by the browser smoke test; nothing else looks at dev.
 */
const ENV_DIR = fileURLToPath(new URL("../src/environments/", import.meta.url));
const VAR = "NG_APP_MEMBERSTACK_PUBLIC_KEY";

const key = process.env[VAR]?.trim();

if (!key) {
  console.log(`[set-env] ${VAR} not set — using environment.ts as committed.`);
  process.exit(0);
}

// A key that is not a key is worth failing on. Shipping a build whose auth
// silently rejects every call is far more expensive to debug than a failed
// build, and this is the only moment we can still tell the difference.
if (!/^pk_(sb_)?[A-Za-z0-9]+$/.test(key)) {
  console.error(
    `[set-env] ${VAR} is "${key}", which is not a Memberstack public key.\n` +
      `          Public keys start with pk_ (Live) or pk_sb_ (Test Mode).`
  );
  process.exit(1);
}

const FIELD = /memberstackPublicKey:\s*"[^"]*"/;

const files = readdirSync(ENV_DIR).filter((name) => name.endsWith(".ts"));
const written = [];

for (const name of files) {
  const path = join(ENV_DIR, name);
  const source = readFileSync(path, "utf8");

  // Test that the field EXISTS, rather than that the text changed. Those are
  // the same thing exactly once: the first build. Every rebuild after that
  // already holds the key, so a changed/unchanged comparison reports "field
  // missing" and fails a deploy that is perfectly fine — and hosts rebuild
  // constantly.
  if (!FIELD.test(source)) continue;

  writeFileSync(path, source.replace(FIELD, `memberstackPublicKey: "${key}"`));
  written.push(name);
}

// None at all means the field was renamed or the files moved. Refuse rather
// than serve an app that cannot authenticate for a reason nothing reports.
if (written.length === 0) {
  console.error(
    `[set-env] No file in ${ENV_DIR} contains memberstackPublicKey.\n` +
      `          Refusing to build rather than deploy an app that cannot authenticate.`
  );
  process.exit(1);
}

console.log(
  `[set-env] Wrote ${VAR} (${
    key.startsWith("pk_sb_") ? "Test Mode" : "Live"
  }) into: ${written.join(", ")}`
);
