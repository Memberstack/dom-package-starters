export default defineNuxtConfig({
  css: ["~/assets/style.css"],

  /**
   * The gated pages are not server-rendered, on purpose.
   *
   * Who is signed in is a fact only the browser has: the SDK reads a cookie, so
   * the server always renders these as signed-out. The client then resolves the
   * session during hydration and the `gated` middleware redirects to /login --
   * at which point Vue is hydrating the Login component against the HTML the
   * server produced for /members, and reports "Hydration completed but contains
   * mismatches" in every visitor's console.
   *
   * `<ClientOnly>` inside the page cannot fix that. It makes the CONTENT match;
   * the mismatch here is that the client is rendering a different PAGE.
   *
   * Turning SSR off for these two routes removes the server HTML there is
   * nothing to match against, and costs nothing: there was never anything
   * meaningful to server-render on a page whose whole content depends on a
   * session the server cannot see. Everything public still server-renders.
   */
  routeRules: {
    "/members": { ssr: false },
    "/account": { ssr: false },
  },

  runtimeConfig: {
    // NUXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY in .env fills this in. Nuxt maps the
    // env name onto the camelCase key automatically.
    //
    // Unlike the other starters, this is read at RUNTIME, not baked into the
    // bundle. Whatever you deploy to needs that variable set, or the key is
    // empty and every call fails without an obvious cause.
    public: { memberstackPublicKey: "" },
  },
});
