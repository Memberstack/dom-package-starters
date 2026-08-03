import { useState } from "react";
import GoogleButton from "./GoogleButton";
import { memberstack } from "./memberstack";

export default function SignupForm() {
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
          onSignedIn={() => {
            // A full load, so every island on /members reads the new session.
            window.location.href = "/members";
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
              await memberstack.signupMemberEmailPassword({
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
              // A full document load, not a history push. Astro is multi-page,
              // so this is what makes the nav on /members reflect the new
              // session — every island there reads it fresh.
              window.location.href = "/members";
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
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}
