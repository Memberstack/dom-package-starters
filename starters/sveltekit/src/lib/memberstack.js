import { browser } from "$app/environment";
import { PUBLIC_MEMBERSTACK_PUBLIC_KEY } from "$env/static/public";
import memberstackDOM from "@memberstack/dom";

let instance;

// Created on first use, in the browser only. The SDK reads `window`, and
// SvelteKit renders every route on the server before it ever reaches one.
export const getMemberstack = () => {
  if (!browser) return null;
  instance ??= memberstackDOM.init({
    publicKey: PUBLIC_MEMBERSTACK_PUBLIC_KEY,
  });
  return instance;
};
