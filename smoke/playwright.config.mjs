import { defineConfig } from "@playwright/test";
import { PORT, STARTERS } from "./starters.mjs";

/**
 * Runs one starter at a time, chosen by STARTER, against a real Memberstack
 * sandbox app.
 *
 * This is the check the rest of CI cannot make. A build proves imports resolve;
 * it does not prove that signup works, that the session survives a refresh, or
 * that the members page is actually gated. Angular's zone.js polyfill is the
 * standing example: without it, install, build and serve all succeed and the
 * browser renders an empty page. Nothing short of loading it catches that.
 */
const starter = process.env.STARTER;
if (!starter || !STARTERS[starter]) {
  throw new Error(
    `Set STARTER to one of: ${Object.keys(STARTERS).join(", ")} (got ${
      starter ?? "nothing"
    })`
  );
}

const publicKey = process.env.MEMBERSTACK_PUBLIC_KEY;
if (!publicKey) throw new Error("Set MEMBERSTACK_PUBLIC_KEY");

// Every framework reads a differently prefixed variable and they all ignore the
// ones that are not theirs, so setting all six is simpler than another table
// that can fall out of step with starters/README.md.
const keyEnv = {
  NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY: publicKey,
  NUXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY: publicKey,
  PUBLIC_MEMBERSTACK_PUBLIC_KEY: publicKey,
  VITE_MEMBERSTACK_PUBLIC_KEY: publicKey,
  NG_APP_MEMBERSTACK_PUBLIC_KEY: publicKey,
};

export default defineConfig({
  testDir: ".",
  // One at a time. The test signs up a fixed address per starter, so two
  // workers on the same starter would race each other's cleanup.
  workers: 1,
  fullyParallel: false,
  // No retries. A flaky pass here is worse than a failure: the whole point is
  // to be the one signal that a starter genuinely works.
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: STARTERS[starter].dev,
    cwd: new URL(`../starters/${starter}/`, import.meta.url).pathname,
    url: `http://localhost:${PORT}`,
    // Never reuse: a server left over from another starter would serve the
    // wrong project and the failure would look like a bug in this one.
    reuseExistingServer: false,
    // Angular and Nuxt cold-start slowly, and a first-run dependency
    // optimisation pass on the Vite ones is slower still.
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: keyEnv,
  },
});
