import { getMemberstack } from "./memberstack";

/**
 * One session for the whole app.
 *
 * A `$state` object exported from a module is Svelte 5's shared-state idiom:
 * every component that imports it reads the same reactive value, so signing in
 * updates the nav and the page together. Note that the OBJECT is exported and
 * its properties are mutated — reassigning an exported `$state` primitive would
 * not propagate.
 *
 * status is "loading" | "in" | "out" — three states, not two. A member object
 * alone cannot tell "signed out" apart from "we have not asked yet", and
 * conflating them is what makes a gated page flash its contents before it
 * redirects.
 */
export const session = $state({
  member: null,
  status: "loading",
  error: "",
});

export async function refresh() {
  const memberstack = getMemberstack();
  if (!memberstack) return; // server render; the client pass does the work

  try {
    const { data } = await memberstack.getCurrentMember();
    session.member = data ?? null;
    session.status = data ? "in" : "out";
    session.error = "";
  } catch (err) {
    // Almost always a bad public key. Without this the app renders a
    // permanently blank page with nothing on screen to explain why.
    session.member = null;
    session.status = "out";
    session.error = err?.message || "Could not reach Memberstack.";
  }
}
