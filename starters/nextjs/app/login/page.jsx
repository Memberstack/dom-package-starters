"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleButton from "../GoogleButton";
import { getMemberstack } from "../memberstack";
import { useMember } from "../useMember";

export default function LogIn() {
  const router = useRouter();
  const { refresh } = useMember();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  // "password" | "code-sent"
  const [mode, setMode] = useState("password");

  /**
   * Passwordless login, in two steps: Memberstack emails a one-time code, the
   * member types it back in. Adoption of this roughly triples between small
   * apps and large ones, which is why it is wired up rather than left as an
   * exercise.
   *
   * It is OFF on a new app. Turn it on in the dashboard under Authentication,
   * or the request below comes back with an error saying so.
   */
  const requestCode = async () => {
    setError("");
    if (!email) {
      setError("Enter your email first, then request a code.");
      return;
    }
    setBusy(true);
    try {
      await getMemberstack().sendMemberLoginPasswordlessEmail({ email });
      setMode("code-sent");
    } catch (err) {
      setError(
        err?.message ||
          "Could not send a code. Passwordless may be off for this app."
      );
    }
    setBusy(false);
  };

  const submitCode = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await getMemberstack().loginMemberPasswordless({
        email,
        passwordlessToken: new FormData(event.currentTarget).get("code"),
      });
      await refresh();
      router.push("/members");
    } catch (err) {
      setError(
        err?.message || "That code did not work. Try requesting a new one."
      );
      setBusy(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await getMemberstack().loginMemberEmailPassword({
        email,
        password: new FormData(event.currentTarget).get("password"),
      });
      await refresh();
      router.push("/members");
    } catch (err) {
      setError(err?.message || "That email and password did not match.");
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="card">
        <h1>Welcome back</h1>
        <p className="sub">Log in to reach your library.</p>

        {error && <p className="err">{error}</p>}

        {mode === "code-sent" ? (
          <>
            <p className="ok">We emailed a one-time code to {email}.</p>
            <form onSubmit={submitCode}>
              <label htmlFor="code">Your code</label>
              <input
                id="code"
                name="code"
                inputMode="numeric"
                autoFocus
                required
              />
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Checking…" : "Log in"}
              </button>
            </form>
            <p className="alt">
              <button
                type="button"
                className="linkish"
                onClick={() => {
                  setMode("password");
                  setError("");
                }}
              >
                Use a password instead
              </button>
            </p>
          </>
        ) : (
          <>
            <GoogleButton
          label="Continue with Google"
          onError={setError}
          onSignedIn={async () => {
            await refresh();
            router.push("/members");
          }}
        />

            <div className="or">or</div>

            <form onSubmit={submitPassword}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />

              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Logging in…" : "Log in"}
              </button>
            </form>

            <p className="alt">
              <button
                type="button"
                className="linkish"
                onClick={requestCode}
                disabled={busy}
              >
                Email me a code instead
              </button>
            </p>
          </>
        )}

        <p className="alt">
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
