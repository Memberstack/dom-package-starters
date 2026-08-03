import { goto } from "$app/navigation";
import { session } from "./member.svelte";

/**
 * Route protection, in one place.
 *
 * Call `requireMember()` at the top of any gated page's `<script>`. Every gated
 * page uses this instead of writing its own redirect, so the rule lives once
 * and a new page cannot get it subtly wrong.
 *
 * This gate runs in the browser, which is the right tool for showing and hiding
 * UI. Anything that must never reach a signed-out visitor has to be checked on
 * your server too, with @memberstack/admin. A client-side check is a UX
 * affordance, not a security boundary.
 */
export function requireMember() {
  $effect(() => {
    // Not while loading, and not when the SDK itself failed — those pages show
    // the error instead, so the cause stays on screen.
    // replaceState, not a push. This effect runs AFTER the gated URL has
    // committed to history, so a plain goto() would leave /members sitting
    // behind /login — Back would return to the gated page, the guard would
    // fire again, and the visitor would be pinned. Next, Remix and Astro all
    // replace for the same reason; Nuxt and Angular gate before the route
    // commits, so they do not need to.
    if (session.status === "out" && !session.error) {
      goto("/login", { replaceState: true });
    }
  });

  return session;
}
