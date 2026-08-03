import { expect, test } from "@playwright/test";
import { deleteTestMember } from "./memberApi.mjs";
import {
  FIRST_NAME,
  GATED_SENTINEL,
  LAST_NAME,
  MEMBER_PASSWORD,
  memberEmail,
} from "./starters.mjs";

/**
 * The check nothing else in this repo makes: does the starter WORK.
 *
 * A production build proves imports resolve. It does not prove that signup
 * reaches Memberstack, that a custom field survives the round trip, that the
 * session outlives a refresh, or that the members page is gated. Angular is the
 * standing example -- without `polyfills: ["zone.js"]`, install, build and
 * serve all succeed and the browser renders an empty page. So does the Google
 * button that awaited its promise and never navigated: every static check in
 * the world passes that.
 *
 * Runs against a real sandbox app. There is no mocking here on purpose; a
 * mocked Memberstack would have passed every bug this is meant to catch.
 */

const STARTER = process.env.STARTER;
const KEY = process.env.MEMBERSTACK_PUBLIC_KEY;
const EMAIL = memberEmail(STARTER);

const credentials = {
  key: KEY,
  email: EMAIL,
  password: MEMBER_PASSWORD,
};

test.beforeAll(async () => {
  await deleteTestMember(credentials);
});

test.afterAll(async () => {
  await deleteTestMember(credentials);
});

/**
 * Console errors are a failure signal, so every test collects them.
 *
 * Each one is stamped with the URL it happened on. Without that, a hydration
 * warning is just a string repeated three times and finding the page that
 * produced it means bisecting the flow by hand.
 */
const watchConsole = (page) => {
  const errors = [];
  const record = (text) => errors.push(`[${page.url()}] ${text}`);
  page.on("console", (msg) => {
    if (msg.type() === "error") record(msg.text());
  });
  page.on("pageerror", (err) => record(String(err)));
  return errors;
};

test(`${STARTER}: signs up, gates, and survives a refresh`, async ({
  page,
}) => {
  const errors = watchConsole(page);

  // --- The home page renders at all -------------------------------------
  //
  // This alone catches the Angular zone.js case and the Nuxt hydration
  // mismatch, both of which build cleanly and produce a broken page.
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /sign up/i }).first()
  ).toBeVisible();
  expect(errors, `console errors on /:\n${errors.join("\n")}`).toEqual([]);

  // --- Gated content is gated BEFORE anyone logs in ----------------------
  //
  // Asserting the redirect alone is not enough: it does not prove the members
  // content never rendered. A page that paints the gated view and then bounces
  // has still shown it, and on a slow connection it is shown for a while.
  //
  // The sentinel is a members-only RESOURCE, not the "Welcome back" heading.
  // That heading is also the login page's own title, so watching for it
  // reported a leak on every run -- flagging the redirect working correctly as
  // the bug it was meant to catch. A sentinel that appears on the page you are
  // redirected TO cannot measure anything.
  const gatedSeen = [];
  const gated = () => page.getByText(GATED_SENTINEL, { exact: false });

  await page.goto("/members");
  gatedSeen.push(await gated().count());
  await page.waitForURL(/\/login/, { timeout: 15_000 });
  gatedSeen.push(await gated().count());

  expect(
    gatedSeen.every((n) => n === 0),
    `members-only content rendered before the redirect (counts: ${gatedSeen})`
  ).toBe(true);

  // --- Signing up --------------------------------------------------------
  await page.goto("/signup");
  await page.getByLabel(/first name/i).fill(FIRST_NAME);
  await page.getByLabel(/last name/i).fill(LAST_NAME);
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(MEMBER_PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();

  await page.waitForURL(/\/members/, { timeout: 30_000 });

  // The greeting carries the first name, which proves the custom field made a
  // round trip through the real API. Custom fields are dropped SILENTLY when
  // the key does not match, so nothing else would report this.
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    FIRST_NAME
  );

  // --- The session is shared, not per-component --------------------------
  //
  // Each page used to hold its own copy of the member, so the nav still said
  // "Log in" on the page you had just signed up to reach. The assertion that
  // catches that is the ABSENCE of the signed-out affordance -- "Log out is
  // visible" alone passed against a nav showing both at once.
  await expect(page.getByRole("button", { name: /log out/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^log in$/i })).toHaveCount(0);

  // --- ...and survives a refresh ----------------------------------------
  await page.reload();
  await expect(page).toHaveURL(/\/members/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    FIRST_NAME
  );

  // --- Logging out puts the gate back ------------------------------------
  //
  // A BUTTON in all six starters, not a link -- logging out is an action, not
  // navigation. Asking for a link here timed out on every framework.
  await page.getByRole("button", { name: /log out/i }).click();
  // Wait for logout's OWN navigation to finish before going anywhere. It
  // clears the session, refreshes the shared state and then routes away, all
  // after the click resolves -- so navigating straight to /members raced it,
  // arrived while the session still looked alive, and read as "the gate is
  // broken".
  //
  // Anywhere-but-/members rather than a specific destination: the handler
  // pushes to "/", but the members page's own guard sees the cleared session
  // first and sends you to /login, so which one wins is a race we do not care
  // about. Pinning "/" made this fail on a starter that was working.
  await page.waitForURL((url) => !url.pathname.startsWith("/members"), {
    timeout: 15_000,
  });
  await expect(
    page.getByRole("link", { name: /^log in$/i }).first()
  ).toBeVisible();

  await page.goto("/members");
  await page.waitForURL(/\/login/, { timeout: 15_000 });
  // The sentinel again, not "Welcome back" -- which is the login page's own
  // heading, so asserting it is absent here asserts the login page is broken.
  await expect(gated()).toHaveCount(0);

  // --- Logging back in ---------------------------------------------------
  //
  // The bar the starters set for themselves: "a starter you can sign up for
  // but not log back into is not finished."
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(MEMBER_PASSWORD);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForURL(/\/members/, { timeout: 30_000 });

  expect(
    errors,
    `console errors during the flow:\n${errors.join("\n")}`
  ).toEqual([]);
});
