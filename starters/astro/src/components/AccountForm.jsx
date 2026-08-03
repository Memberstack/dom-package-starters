import { useEffect, useState } from "react";
import { memberstack } from "./memberstack";
import { useRequireMember } from "./useMember";

export default function AccountForm() {
  const { member, status, error, refresh } = useRequireMember();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);

  // Seed the form once the member arrives. Without the guard this would clobber
  // whatever the person is typing on every re-render.
  useEffect(() => {
    if (!member) return;
    setFirst(member.customFields?.["first-name"] ?? "");
    setLast(member.customFields?.["last-name"] ?? "");
  }, [member]);

  if (error) {
    return <p className="notice">Could not reach Memberstack: {error}</p>;
  }
  if (status !== "in" || !member) return null;

  const plans = member.planConnections?.filter((plan) => plan.active) ?? [];

  return (
    <div className="auth">
      <span className="eyebrow">Account</span>
      <h1>Your details</h1>
      <p className="sub">
        This reads and writes the same custom fields your signup form collected.
      </p>

      <div className="card">
        {saveError && <p className="err">{saveError}</p>}
        {saved && <p className="ok">Saved.</p>}

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setSaved(false);
            setSaveError("");
            try {
              // updateMember takes the whole customFields object. Keys missing
              // from your dashboard are dropped silently, same as at signup.
              await memberstack.updateMember({
                customFields: { "first-name": first, "last-name": last },
              });
              await refresh();
              setSaved(true);
            } catch (err) {
              setSaveError(err?.message || "Could not save those changes.");
            }
            setBusy(false);
          }}
        >
          <div className="row">
            <div>
              <label htmlFor="first">First name</label>
              <input
                id="first"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="last">Last name</label>
              <input
                id="last"
                value={last}
                onChange={(e) => setLast(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Membership</h2>
        <dl className="dl" style={{ marginTop: 14 }}>
          <div>
            <dt>Email</dt>
            <dd>{member.auth?.email}</dd>
          </div>
          <div>
            <dt>Member ID</dt>
            <dd>{member.id}</dd>
          </div>
          <div>
            <dt>Plan</dt>
            <dd>
              {plans.length
                ? plans.map((plan) => plan.planId).join(", ")
                : "None"}
            </dd>
          </div>
        </dl>

        {!plans.length && (
          <p className="hint">
            No plan is needed — this site gates on being signed in. To gate on a
            plan instead, pass <code>plans</code> at signup or call{" "}
            <code>addPlan()</code>.
          </p>
        )}
      </div>
    </div>
  );
}
