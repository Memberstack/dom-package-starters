import memberstackDOM from "@memberstack/dom";

let instance;

// Created on first use, in the browser only. The SDK reads `window`, and
// Remix renders every route on the server first.
export const getMemberstack = () => {
  if (typeof window === "undefined") return null;
  instance ??= memberstackDOM.init({
    publicKey: import.meta.env.VITE_MEMBERSTACK_PUBLIC_KEY,
  });
  return instance;
};
