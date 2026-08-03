# Memberstack starter — Angular

A working membership site: signup, login, logout, a gated members area, and an
account page that reads and writes member data. Google sign-in is wired up and
works immediately.

## Run it

```bash
npm install
npm start
```

Your public key is already in `src/environments/environment.ts`. Nothing else to configure.

> **If you got here by deploying to Vercel**, the key lives in your Vercel
> project settings, not in this repo — the committed `src/environments/environment.ts` still holds a
> placeholder. The hosted site works. To run it locally, copy
> `NG_APP_MEMBERSTACK_PUBLIC_KEY` out of Vercel's Environment Variables into `src/environments/environment.ts` first.

Sign up, and you land in the members area. Sign out and try `/members` again —
you get sent to the login page.

## Make it yours

Everything fictional lives in **`src/site.config.ts`**: the name, the headline, and the list
of gated resources. Change that one file and this is your site. If you find
yourself editing a component to change wording, that text belongs in the config
instead.

## What's in here

| File | What it does |
|---|---|
| `src/site.config.ts` | All the demo content. Start here. |
| `src/app/memberstack.ts` | Creates the SDK. |
| `src/app/member.service.ts` | The shared session, as signals on a root service. |
| `src/app/gated.guard.ts` | `canActivate` route guard. |
| `src/app/signup.component.ts`, `login.component.ts` | Email + password, Google, and passwordless. |
| `src/app/members.component.ts`, `account.component.ts` | The two gated routes. |

Two details worth knowing, because both cause bugs that are hard to see:

**The session has three states, not two.** `status` is `"loading"`, `"in"`, or
`"out"`. A member object alone cannot tell "signed out" apart from "we haven't
checked yet", and treating them the same is what makes a gated page flash its
contents before redirecting.

**The session lives on a root-provided service**, so every component that injects
`MemberService` reads the same signals. Call `refresh()` after anything that
changes who is signed in.

**The gate is a real router guard**, which is the nicest version in any of these
starters: `canActivate` runs *before* the route activates, so a signed-out
visitor never renders the gated component at all. No "render nothing, then
redirect", and no chance of content flashing on screen first.

## Turn these on next

Your site works now. These are the things Memberstack apps switch on as they
grow, all off by default. Each is a toggle in the dashboard, not a code change.

1. **Passwordless login** — Authentication → Passwordless. The login page
   already has "Email me a code instead"; it returns an error until you enable
   it. Adoption of this roughly triples between small apps and large ones.
2. **Email verification** — Authentication. Makes new members confirm their
   address.
3. **Welcome email** — Notifications.
4. **When you start charging** — connect Stripe, create a paid plan, then turn
   on abandoned-cart emails. Members who leave checkout half-finished get a
   nudge.

## Gating on a plan instead of on sign-in

This starter gates on *being signed in*, which needs no setup — a new app has no
plans, and members are created fine without one.

To gate on a plan, assign one and check for it:

```js
// at signup
await memberstack.signupMemberEmailPassword({
  email,
  password,
  plans: [{ planId: "pln_..." }],
});

// or later
await memberstack.addPlan({ planId: "pln_..." });

// then gate on it
member.planConnections.some((p) => p.planId === "pln_..." && p.active);
```

## Custom fields

Signup collects first and last name. Those two fields (`first-name` and
`last-name`) exist on every Memberstack app already, so they work with no setup.

> **If you add a field, create it in the dashboard first.** Custom field keys are
> matched exactly, and a key that does not exist is dropped **silently** — no
> error, the value just never arrives. This is the most confusing thing to debug
> in a Memberstack signup form.

## Deploying

**One-click deploy works.** Angular has no `.env` file — `environment.ts` is
compiled into the bundle — which normally makes deploying from a Git repo
awkward, because a host has environment variables and no file to edit. So
`npm run build` runs `scripts/set-env.mjs` first:

- If `NG_APP_MEMBERSTACK_PUBLIC_KEY` is set, it writes that key into
  `environment.ts` before Angular compiles.
- If it is **not** set, it does nothing and your committed file is used exactly
  as-is. Building locally is unchanged, and nobody's edit gets clobbered.

It also refuses to build on a value that is not a `pk_` key, because a bundle
whose auth silently rejects every call is far more expensive to find than a
failed build.

`vercel.json` handles the other two Angular-specific things: the build writes to
`dist/browser` rather than `dist`, and every unknown path has to serve
`index.html`. Without that rewrite a hard refresh on `/members` 404s, which
reads to a customer as "the session did not survive a refresh" and sends them
looking in entirely the wrong place. On Netlify the equivalent is a `_redirects`
file containing `/*  /index.html  200`.

Two environment files: `environment.ts` is the one that ships (production is the
default configuration and gets **no** file replacement), and
`environment.development.ts` is swapped in for `ng serve`. Put your live key in
`environment.ts` and a test key in the development one, and local work stays off
your live members even after you go live.

## Before you launch

Test Mode keys start `pk_sb_` and the members you create are free and never
touch your live site. Live keys start `pk_`. Swap `memberstackPublicKey` in `src/environments/environment.ts` from Dev Tools when you
are ready, and redeploy.

The gates here run in the browser, which is the right tool for showing and
hiding UI. Anything that must never reach a signed-out visitor has to be checked
on your server too, with `@memberstack/admin`. A client-side check is a UX
affordance, not a security boundary.

## Docs

https://developers.memberstack.com
