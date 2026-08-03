import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { MemberService } from "./member.service";

/**
 * Route protection, in one place.
 *
 * Attach it with `canActivate: [gatedGuard]` in app.routes.ts.
 *
 * This is the nicest version of the gate in any of these starters, because
 * Angular gives it a real place to live. The guard runs BEFORE the route
 * activates, so a signed-out visitor never renders the gated component at all —
 * no "render nothing, then redirect" step, and no chance of the content
 * flashing on screen first.
 *
 * It still runs in the browser, which is the right tool for showing and hiding
 * UI. Anything that must never reach a signed-out visitor has to be checked on
 * your server too, with @memberstack/admin. A client-side check is a UX
 * affordance, not a security boundary.
 */
export const gatedGuard: CanActivateFn = async () => {
  const members = inject(MemberService);
  const router = inject(Router);

  // First navigation of the session: nobody has asked yet. Awaiting here is
  // what lets the guard decide correctly instead of guessing.
  const status =
    members.status() === "loading" ? await members.refresh() : members.status();

  // Let the route through when the SDK itself failed, so the page can show the
  // reason. Bouncing to /login would replace a real error with a login form and
  // hide the actual problem.
  if (status === "in" || members.error()) return true;

  return router.createUrlTree(["/login"]);
};
