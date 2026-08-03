import memberstackDOM from "@memberstack/dom";

// Anything with this prefix is exposed to the browser by the build tool. A
// public key is designed to ship in front-end code, so this is the right place.
export const memberstack = memberstackDOM.init({
  publicKey: import.meta.env.PUBLIC_MEMBERSTACK_PUBLIC_KEY,
});
