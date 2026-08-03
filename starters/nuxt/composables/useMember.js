/**
 * One session for the whole app.
 *
 * `useState` is Nuxt's own shared-state primitive: every component that calls
 * useMember() gets the same refs, so signing in updates the nav and the page
 * together. The React version of this starter needs a context provider to do
 * the same thing; in Nuxt it is built in.
 *
 * status is "loading" | "in" | "out" — three states, not two. A member object
 * alone cannot tell "signed out" apart from "we have not asked yet", and
 * conflating them is what makes a gated page flash its contents before it
 * redirects.
 */
export const useMember = () => {
  const member = useState("ms-member", () => null);
  const status = useState("ms-status", () => "loading");
  const error = useState("ms-error", () => "");

  const refresh = async () => {
    const { $memberstack } = useNuxtApp();
    try {
      const { data } = await $memberstack.getCurrentMember();
      member.value = data ?? null;
      status.value = data ? "in" : "out";
      error.value = "";
    } catch (err) {
      // Almost always a bad public key. Without this the app renders a
      // permanently blank page with nothing on screen to explain why.
      member.value = null;
      status.value = "out";
      error.value = err?.message || "Could not reach Memberstack.";
    }
  };

  return { member, status, error, refresh };
};
