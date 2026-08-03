/**
 * How to boot each starter, and what to call the member it signs up.
 *
 * One port for all six, because they run one at a time. Each framework needs
 * its own flag spelling for it, which is the only reason this table exists
 * rather than a single command string.
 */
export const PORT = 3100;

/**
 * Through `npm run dev`, not the framework binary directly.
 *
 * Playwright runs webServer.command in a plain shell, where node_modules/.bin
 * is not on PATH, so `next dev` is "command not found". Going through npm also
 * means each starter's own dev script stays the single source of truth for how
 * it boots -- this table only adds the port.
 *
 * The `--` passes the port through npm to the framework. Next spells it `-p`;
 * everything else spells it `--port`.
 */
export const STARTERS = {
  nextjs: { dev: `npm run dev -- -p ${PORT}` },
  nuxt: { dev: `npm run dev -- --port ${PORT}` },
  sveltekit: { dev: `npm run dev -- --port ${PORT} --strictPort` },
  remix: { dev: `npm run dev -- --port ${PORT} --strictPort` },
  astro: { dev: `npm run dev -- --port ${PORT}` },
  // Angular has no dotenv mechanism, so the key is compiled in by
  // scripts/set-env.mjs before the server starts. See starters/README.md.
  angular: {
    dev: `node scripts/set-env.mjs && npm run start -- --port ${PORT}`,
  },
};

/**
 * The test member's address, fixed per starter rather than unique per run.
 *
 * A unique address per run would be tidier in isolation and is the wrong
 * choice here: a sandbox app caps at 50 members, cleanup happens in the
 * browser, and any run that dies before its cleanup step leaks one. Enough
 * crashed runs and CI starts failing at the cap for a reason that has nothing
 * to do with the change under test.
 *
 * Fixed addresses bound the app at six members no matter how many runs die,
 * because each run deletes the previous one's member before signing up. The
 * cost is that two runs cannot overlap on one app -- which is why the workflow
 * runs this job with concurrency of one.
 */
export const memberEmail = (starter) =>
  `smoke-${starter}@memberstack-starters.test`;

export const MEMBER_PASSWORD = "SmokeTest!2026";
export const FIRST_NAME = "Smoke";
export const LAST_NAME = "Tester";

/**
 * A string that appears ONLY behind the login, in every starter.
 *
 * Picking this is the whole difficulty of the "content never leaked" check,
 * and two obvious choices are both wrong:
 *
 * - "Welcome back" is the members page heading AND the login page's own title,
 *   so watching for it reports a leak every time the redirect works.
 * - A resource TITLE is on the public home page, which renders the first three
 *   as locked previews.
 *
 * A resource BODY is rendered only by the members page. Verified across all six
 * starters: present in every site.config, rendered by no public page.
 */
export const GATED_SENTINEL = "day rate you can defend";
