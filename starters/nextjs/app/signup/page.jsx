"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleButton from "../GoogleButton";
import { getMemberstack } from "../memberstack";
import { useMember } from "../useMember";

export default function SignUp() {
  const router = useRouter();
  const { refresh } = useMember();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="auth">
      <div className="card">
        <h1>Create your account</h1>
        <p className="sub">Free, and takes about ten seconds.</p>

        {error && <p className="err">{error}</p>}

        <GoogleButton
          label="Continue with Google"
          onError={setError}
          onSignedIn={async () => {
            await refresh();
            router.push("/members");
          }}
        />

        <div className="or">or</div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setBusy(true);
            const form = new FormData(event.currentTarget);

            try {
              await getMemberstack().signupMemberEmailPassword({
                email: form.get("email"),
                password: form.get("password"),
                /**
                 * These two keys are not invented — every Memberstack app is
                 * created with `first-name` and `last-name` custom fields
                 * already defined, so they work with no dashboard setup.
                 *
                 * Note the kebab-case. Custom field keys are matched exactly,
                 * and a key that does not exist in your dashboard is dropped
                 * SILENTLY: no error, the value simply never arrives. If you
                 * add a field to this form, create it in the dashboard first
                 * (Members -> Custom fields) or you will be debugging a value
                 * that vanishes without a trace.
                 */
                customFields: {
                  "first-name": form.get("firstName"),
                  "last-name": form.get("lastName"),
                },
                /**
                 * To put every new member on a plan, pass it here:
                 *   plans: [{ planId: "pln_..." }]
                 * Members are created fine without one, which is why this
                 * starter gates on being signed in rather than on a plan.
                 */
              });
              // Update the shared session before routing, or the nav arrives
              // on the next page still showing "Log in".
              await refresh();
              router.push("/members");
            } catch (err) {
              // Signing up an address that already exists rejects here, which
              // is the single most common thing to hit while testing. Showing
              // it beats a form that looks like it did nothing.
              setError(err?.message || "Could not create that account.");
              setBusy(false);
            }
          }}
        >
          <div className="row">
            <div>
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Creating your account…" : "Create account"}
          </button>
        </form>

        <p className="alt">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
