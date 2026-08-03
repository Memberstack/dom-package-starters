# dist

**Generated. Do not edit by hand.** Every file here is derived from `starters/` by
`scripts/build-dist.mjs`.

Regenerate with `node scripts/build-dist.mjs` after editing any starter, and commit the result.
CI runs `--check`, which fails the build when what is committed here differs from what the sources
produce — so an edited starter cannot ship behind a stale bundle.

One JSON file per starter, containing every file of that starter with its contents. This is what the
dashboard fetches.

## Why a bundle instead of fetching the files individually

Two reasons, and the second is the important one.

Fewer round trips: a Next.js starter is eleven files, so per-file fetching is eleven requests where
this is one.

**Atomicity.** `raw.githubusercontent.com` caches for five minutes. Fetching eleven files
individually can return some from before a fix and some from after, and assemble a project that
never existed in this repo and that nobody has ever tested. Downloading one object makes that
impossible.

## Why it is committed rather than built on demand

There is nowhere to build it. The dashboard reads this over raw content from a browser, with no
server in the path, which is the whole reason the delivery mechanism works without infrastructure.
So the artifact has to exist as a file in the repo.

The cost is that a generated file is committed and can go stale. `--check` in CI is the guard.
