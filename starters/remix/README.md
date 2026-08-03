# Memberstack starter — Remix

A working membership site: signup, login, logout, a gated members area, and an
account page that reads and writes member data. Google sign-in is wired up and
works immediately.

## Run it

```bash
npm install
npm run dev
```

Your public key is already in `.env.local`. Nothing else to configure.

> **If you got here by deploying to Vercel**, the key lives in your Vercel
> project settings, not in this repo — the committed `.env.local` still holds a
> placeholder. The hosted site works. To run it locally, copy
> `VITE_MEMBERSTACK_PUBLIC_KEY` out of Vercel's Environment Variables into `.env.local` first.

Sign up, and you land in the members area. Sign out and try `/members` again —
you get sent to the login page.

## Make it yours

Everything fictional lives in **`app/site.config.js`**: the name, the headline, and the list
of gated resources. Change that one file and this is your site. If you find
yourself editing a component to change wording, that text belongs in the config
instead.

## What's in here

| File | What it does |
|---|---|
| `app/site.config.js` | All the demo content. Start here. |
| `app/memberstack.js` | Creates the SDK once, in the browser only. |
| `app/MemberProvider.jsx` | One shared session for the whole app. |
| `app/useMember.js` | `useMember()` to read it, `useRequireMember()` to gate a route. |
| `app/routes/signup.jsx`, `login.jsx` | Email + password, Google, and passwordless. |
| `app/routes/members.jsx`, `account.jsx` | The two gated routes. |

Two details worth knowing, because both cause bugs that are hard to see:

**The session has three states, not two.** `status` is `"loading"`, `"in"`, or
`"out"`. A member object alone cannot tell "signed out" apart from "we haven't
checked yet", and treating them the same is what makes a gated page flash its
contents before redirecting.

**The session is shared, not per-component.** `MemberProvider` fetches it once and
every component reads the same value. If each fetched its own, the nav would still
say "Log in" after you signed up, because it lives in the root route and never
re-rendered. Call `refresh()` after anything that changes who is signed in.

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

Any Node host. `VITE_`-prefixed variables are inlined at build time, so set it **before** you build — changing it afterwards has no effect until you rebuild.

## Before you launch

Test Mode keys start `pk_sb_` and the members you create are free and never
touch your live site. Live keys start `pk_`. Swap `VITE_MEMBERSTACK_PUBLIC_KEY` in `.env.local` from Dev Tools when you
are ready, and redeploy.

The gates here run in the browser, which is the right tool for showing and
hiding UI. Anything that must never reach a signed-out visitor has to be checked
on your server too, with `@memberstack/admin`. A client-side check is a UX
affordance, not a security boundary.

## Docs

https://developers.memberstack.com
