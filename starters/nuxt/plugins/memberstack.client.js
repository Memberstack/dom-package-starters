import memberstackDOM from "@memberstack/dom";

// The .client suffix is load-bearing. Nuxt runs this file in the browser only,
// which the SDK requires: it reads `window` as soon as it initialises.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const memberstack = memberstackDOM.init({
    publicKey: config.public.memberstackPublicKey,
  });

  return { provide: { memberstack } };
});
