import { useNavigate } from "@remix-run/react";
import { useContext, useEffect } from "react";
import { MemberContext } from "./MemberProvider";

/**
 * Read the shared session.
 *
 * Returns { member, status, error, refresh } where status is one of:
 *
 *   "loading" - the first getCurrentMember() has not come back yet
 *   "in"      - there is a member
 *   "out"     - there is no member, or the lookup failed
 *
 * Call refresh() after anything that changes who is signed in, so the nav and
 * every other consumer update together.
 */
export function useMember() {
  const value = useContext(MemberContext);
  if (!value) {
    throw new Error("useMember must be used inside <MemberProvider>.");
  }
  return value;
}

/**
 * Route protection, in one place.
 *
 * Every gated page calls this instead of writing its own redirect, so the rule
 * lives once and a new page cannot get it subtly wrong.
 *
 * This gate runs in the browser, which is the right tool for showing and hiding
 * UI. Anything that must never reach a signed-out visitor — files, records,
 * anything you would mind being read — has to be checked on your server too,
 * with @memberstack/admin. A client-side check is a UX affordance, not a
 * security boundary.
 */
export function useRequireMember() {
  const navigate = useNavigate();
  const session = useMember();

  useEffect(() => {
    // Not while loading, and not when the failure was the SDK itself — those
    // pages show the error instead, so the cause stays on screen.
    if (session.status === "out" && !session.error) navigate("/login", { replace: true });
  }, [session.status, session.error, navigate]);

  return session;
}
