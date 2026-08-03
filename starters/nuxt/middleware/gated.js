/**
 * Route protection, in one place.
 *
 * Add `definePageMeta({ middleware: "gated" })` to any page that needs a member.
 * This is Nuxt's native mechanism, so the check runs as part of navigation
 * rather than as an effect after the page has already started rendering.
 *
 * This gate runs in the browser, which is the right tool for showing and hiding
 * UI. Anything that must never reach a signed-out visitor has to be checked on
 * your server too, with @memberstack/admin. A client-side check is a UX
 * affordance, not a security boundary.
 */
export default defineNuxtRouteMiddleware(async () => {
  // The SDK needs `window`, so there is nothing to check during SSR. The
  // client-side pass of this same middleware does the real work.
  if (import.meta.server) return;

  const { status, error, refresh } = useMember();

  // First navigation of the session: nobody has asked yet.
  if (status.value === "loading") await refresh();

  // Not when the SDK itself failed — those pages show the error instead, so
  // the cause stays on screen rather than being replaced by a login form.
  if (status.value === "out" && !error.value) {
    return navigateTo("/login");
  }
});
