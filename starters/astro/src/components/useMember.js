import { useCallback, useEffect, useState } from "react";
import { memberstack } from "./memberstack";

/**
 * The session, as three states rather than two.
 *
 *   "loading" - the first getCurrentMember() has not come back yet
 *   "in"      - there is a member
 *   "out"     - there is no member, or the lookup failed
 *
 * `member` alone cannot tell "signed out" apart from "we have not asked yet",
 * and treating those the same is what makes a gated page flash its contents
 * before redirecting.
 *
 * NOTE FOR ASTRO: unlike the React, Vue and Svelte starters, there is no shared
 * session here and that is deliberate. Astro is multi-page — every navigation
 * is a full document load, so the nav is rebuilt from scratch each time and
 * cannot go stale. The React starter needs a context provider to stop the nav
 * saying "Log in" after signup; that bug simply cannot happen here, so adding
 * cross-island state (nanostores or similar) would be a dependency solving a
 * problem this architecture does not have.
 *
 * The one thing to remember: after signing in or out, navigate with
 * `window.location` rather than pushing history, so every island re-reads the
 * session on the new document.
 */
export function useMember() {
  const [member, setMember] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const { data } = await memberstack.getCurrentMember();
      setMember(data ?? null);
      setStatus(data ? "in" : "out");
      setError("");
    } catch (err) {
      // Almost always a bad public key. Without this branch the island renders
      // nothing forever and there is no clue on screen as to why.
      setMember(null);
      setStatus("out");
      setError(err?.message || "Could not reach Memberstack.");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { member, status, error, refresh };
}

/**
 * Route protection, in one place.
 *
 * This gate runs in the browser, which is the right tool for showing and hiding
 * UI. Anything that must never reach a signed-out visitor has to be checked on
 * your server too, with @memberstack/admin. A client-side check is a UX
 * affordance, not a security boundary — and on a static Astro build the page
 * HTML is public regardless, so keep real secrets out of gated pages entirely.
 */
export function useRequireMember() {
  const session = useMember();

  useEffect(() => {
    // Not when the SDK itself failed — those islands show the error instead,
    // so the cause stays on screen. `replace` keeps the gated URL out of
    // history, so Back does not bounce the visitor through it again.
    if (session.status === "out" && !session.error) {
      window.location.replace("/login");
    }
  }, [session.status, session.error]);

  return session;
}
