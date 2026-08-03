"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import { getMemberstack } from "./memberstack";

/**
 * One session for the whole app.
 *
 * The obvious version of this is a `useMember()` hook that each component calls
 * for itself — and it looks fine until you try it: sign up, get redirected, and
 * the nav still says "Log in", because the nav lives in the layout, never
 * remounted, and is still holding the answer it got before you had an account.
 * Every caller was its own island of state.
 *
 * So the session is fetched once, here, and shared. `refresh()` updates every
 * consumer at the same time, which is what signup, login and logout call.
 */
export const MemberContext = createContext(null);

export default function MemberProvider({ children }) {
  const [member, setMember] = useState(null);
  // "loading" | "in" | "out" — three states, not two. `member === null` cannot
  // tell "signed out" apart from "we have not asked yet", and conflating them
  // is what makes a gated page flash its contents before redirecting.
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const { data } = await getMemberstack().getCurrentMember();
      setMember(data ?? null);
      setStatus(data ? "in" : "out");
      setError("");
    } catch (err) {
      // Almost always a bad public key. Without this branch the app renders a
      // permanently blank page with nothing on screen to explain why.
      setMember(null);
      setStatus("out");
      setError(err?.message || "Could not reach Memberstack.");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <MemberContext.Provider value={{ member, status, error, refresh }}>
      {children}
    </MemberContext.Provider>
  );
}
