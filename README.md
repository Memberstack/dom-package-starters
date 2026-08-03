# Memberstack starter projects

Framework starter projects for [`@memberstack/dom`](https://www.npmjs.com/package/@memberstack/dom).

Each one is a real, runnable project with signup, login, a members-only page, and a session that
survives a refresh. Pick the framework you already use, add your public key, and you have a working
membership site in about a minute.

| Starter | Framework |
| --- | --- |
| [`nextjs`](./starters/nextjs) | Next.js 15, App Router |
| [`nuxt`](./starters/nuxt) | Nuxt 3, Vue 3 |
| [`sveltekit`](./starters/sveltekit) | SvelteKit 2, Svelte 5 runes |
| [`remix`](./starters/remix) | Remix 2 on Vite |
| [`astro`](./starters/astro) | Astro 5, one auth island |
| [`angular`](./starters/angular) | Angular 19, standalone APIs |

## Getting one

The easiest way is from the Memberstack dashboard, under **Getting Started**. It fills your public
key in for you and hands you a zip, or deploys the starter to Vercel in one click.

To run one straight from here:

```bash
git clone https://github.com/Memberstack/dom-package-starters
cd dom-package-starters/starters/nextjs
npm install
```

Then put your Memberstack public key in the project's env file and `npm run dev`. Each starter's own
README names the file and the variable, because they differ per framework. Your public key is in the
dashboard under **Dev Tools**.

## What each starter contains

- Signup and login, with email and password
- Google sign-in and passwordless, both ready to switch on in the dashboard
- A members-only page that is actually gated
- An account page
- First and last name captured at signup, into Memberstack's custom fields
- One config file holding all the placeholder business content, so you can make it yours without
  hunting through components

They are meant to be edited and thrown away, not depended on. There is no Memberstack-specific
abstraction layer to learn: every starter calls `@memberstack/dom` directly, so what you read here is
what the package actually does.

## Is it safe that this repo is public?

Yes, and it has to be.

The dashboard reads these starters from `raw.githubusercontent.com` in your browser. Raw content on a
private repo needs an `Authorization` header, and any token that reaches a browser stops being secret
the moment it gets there. So the repo is public because that is the only way the download can work
without a server in the middle.

Nothing secret lives here. The only credential a starter carries is your **public** key, which is
designed to ship in front-end code, and it is injected at download time rather than committed. The
generator refuses to publish a bundle containing anything that looks like a real key.

If you are wondering why the dashboard does not just use the GitHub API: it allows 60 requests an
hour **per IP address**, so one agency behind a single office connection would exhaust it in a few
downloads and everybody there would start failing. The whole-repo archive endpoint refuses our origin
outright. Raw content is the only option that is both CORS-open and CDN-backed.

## For contributors

Push straight to `main`. There is no pull request to open, no review to wait for and no second
branch — with a team this size that ceremony would cost more than it caught.

What protects customers instead is which commit they actually read:

> **The dashboard reads the `live` tag, not `main`.**

CI runs on every push to `main` and takes about ninety seconds. If everything passes, it moves
`live` to that commit and the CDN picks it up within roughly five minutes. If anything fails, the
tag does not move: the broken commit sits on `main`, visibly red, and reaches nobody. Fix it with
the next push.

This is why you can commit freely here without a release process, and why a red build is not an
emergency. It is also why **you should not move the `live` tag by hand.**

Every check is load-bearing for that reason. On every push to `main`, CI:

- runs the generator's tests, which cover the guards that stop a broken bundle shipping
- fails if `dist/` is stale, so an edited starter cannot ship behind the old bundle
- produces a production build of all six starters
- fails if a build modified any tracked file it should not have
- **loads each starter in a real browser** and drives the whole flow: sign up, check the first name
  survived the round trip into a custom field, refresh, log out, log back in, and confirm the
  members-only content never appeared while signed out

That last one is the check the others cannot make. A build proves imports resolve; it does not prove
signup reaches Memberstack. Angular's `zone.js` invariant is the standing example — without it,
install, build and serve all succeed and the browser renders an empty page.

It runs against a dedicated sandbox app whose **public** key is in repo secrets, and it is skipped
rather than failed when that key is unavailable, which is the case for pull requests opened from a
fork. See [`smoke/`](./smoke). If that key ever goes missing on `main`, the publish step fails
loudly rather than tagging code the browser test never touched.

Read [`starters/README.md`](./starters/README.md) before changing a starter. It documents the
invariants, several of which were discovered by shipping the bug first.

Adding a starter here is enough to make it appear in the dashboard's picker. The dashboard holds no
list of its own any more — it renders whatever `manifest.json` declares, and reads each starter's
env path and setup file from that starter. Nothing to keep in step, and nothing to drift.

## Layout

```
starters/     the starter projects, one directory per framework
scripts/      the generator that produces dist/ and manifest.json
dist/         generated bundles the dashboard fetches, not edited by hand
```
