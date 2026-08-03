# Starters

One directory per framework. Each is a real project someone can unzip, `npm install`, and run.

Six complete projects live here — nextjs, nuxt, sveltekit, remix, astro, angular.
The dashboard fetches them from this repo at download time, so a fix lands with a
commit here rather than a dashboard release.

## The promise

The dashboard prints this above the starter picker, so it has to be true of every starter here:

- Signup and login
- A members-only page, already gated
- A session that survives a refresh

All six now implement it. `loginMemberEmailPassword` appears in every starter, alongside
Google and passwordless. If you add a seventh, the promise above is the bar: a starter you
can sign up for but not log back into is not finished. Do not ship
the claim without the code.

## Invariants

Every one of these was learned by shipping the bug, so please do not quietly relax one.

**Angular needs `polyfills: ["zone.js"]` in `angular.json`.** Without it, `npm install` succeeds,
`ng build` succeeds, `ng serve` serves, and the browser renders an empty `<app-root>` while throwing
NG0908 into the console. Every check short of loading the page in a real browser reports success.

This is the reason CI runs a real browser (see [`smoke/`](../smoke)) and not just a build. That job
loads every starter and fails on any console error, which is what makes this class of bug visible at
all — it is silent everywhere else.

**Ship a `.gitignore` that covers the env file.** The customer's key is written into the project at
download time. Without a gitignore, their very first `git add .` commits it.

That gitignore also applies **inside this repo**, which is a trap worth knowing about. Each starter's
`.gitignore` lists its own env file, so a plain `git add -A` silently drops all six of them here.
They have to be force-added (`git add -f`). The dashboard would still work, because it reads the
generated bundle in `dist/` rather than the loose files, but anyone cloning this repo to run a
starter would find no env file and no explanation. If you regenerate and the env files vanish from
your diff, this is why.

**Get the env file name right, per framework.** They disagree, and the failure is a silent
`undefined` rather than an error:

| Framework | File | Variable |
| --- | --- | --- |
| Next.js | `.env.local` | `NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY` |
| Nuxt | `.env` | `NUXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY` |
| SvelteKit | `.env.local` | `PUBLIC_MEMBERSTACK_PUBLIC_KEY` |
| Astro | `.env.local` | `PUBLIC_MEMBERSTACK_PUBLIC_KEY` |
| Remix | `.env.local` | `VITE_MEMBERSTACK_PUBLIC_KEY` |
| Angular | `src/environments/environment.ts` | `memberstackPublicKey` |

Nuxt is the one that catches people: it reads `.env` and **ignores `.env.local` entirely**, so the
file name that works everywhere else silently produces an undefined key there. The Vite-based ones
(SvelteKit, Astro, Remix) all read `.env.local` happily.

Angular has no dotenv mechanism at all. Its key lives in a committed TypeScript file, which is why
its `.gitignore` cannot protect it the way the others can, and why the value there is a publishable
key and nothing else ever should be.

This table is not the source of truth. `manifest.json` is, and it is generated from the starters
themselves, so if the two disagree believe the manifest and fix this table.

**Every starter must production-build, not just dev-serve.** Several classes of bug only appear at
build time.

**Every starter must pass a real signup in a real browser**, and its gated route must bounce a
signed-out visitor. A green build proves very little here.

## About SSR and `init()`

There is a widely repeated claim, including in comments in the dashboard source, that
`@memberstack/dom` reads `window` the moment it initialises, so a module-scope `init()` passes
`next dev` and then crashes the production build.

**That is not true.** Run under Node with no `window` and no `document`:

```
typeof window: undefined | typeof document: undefined
init() at module scope with NO window SUCCEEDED
methods on the instance: 69
getCurrentMember() -> {"data":null}
```

The one module-scope `window` access in the SDK is guarded with `typeof window !== "undefined"`.
Astro and Angular both init at module scope and both work, including Astro server-rendering its
hydrated island at build time.

Initialising lazily from browser-only code is still reasonable, and calling SDK **methods** during a
server render is a genuine hazard. But please describe the real reason rather than repeating the
false one, and do not add null-returning accessors to defend against a problem that does not exist.

(Evidence caveat: the runtime check above ran against 2.0.6, the only version installed locally at
the time. The guard was read in 2.0.13's source but not executed.)

## Adding a starter

CI discovers starters by directory rather than from a list, so a new one is covered by the full suite
automatically. There is no register to remember to update, which is the point.

1. Create `starters/<framework>/`.
2. Make it run: signup, a gated page, logout, and login.
3. Read the invariants above and check each one against your project.
4. Run `node scripts/build-dist.mjs` from the repo root and commit the
   regenerated `dist/` — CI fails the PR if you forget.
5. Open a PR. CI installs and production-builds all six starters, runs the
   generator tests, and checks `dist/` is not stale. It does **not** yet drive a
   signup in a browser, so do that once by hand against a Test Mode key.

## What CI enforces

To be built as the content lands. At minimum, per starter, on every PR:

- `npm install` and a production build
- A real browser signup, plus the gated route bouncing a signed-out visitor
- The invariants above, each as a named test that says what it prevents

Plus, repo-wide:

- The manifest regenerated and compared against what is committed, so a file added to a starter
  without a manifest update fails rather than silently shipping an incomplete project
- A scheduled run on a fresh install, because nothing changes here when a framework ships a new
  major and breaks a starter
