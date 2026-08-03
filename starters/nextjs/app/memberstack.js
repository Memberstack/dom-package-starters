"use client";

import memberstackDOM from "@memberstack/dom";

let instance;

// Created on first use rather than at import time. The SDK needs `window`,
// which does not exist during the server render that `next build` performs.
export const getMemberstack = () => {
  instance ??= memberstackDOM.init({
    publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY,
  });
  return instance;
};
