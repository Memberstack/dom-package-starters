<script>
import { requireMember } from "$lib/guard.svelte";
import { getMemberstack } from "$lib/memberstack";
import { refresh } from "$lib/member.svelte";

const session = requireMember();

let first = $state("");
let last = $state("");
let saved = $state(false);
let saveError = $state("");
let busy = $state(false);
let seeded = false;

// Seed the form once the member arrives. The flag keeps a later refresh from
// clobbering whatever the person is typing.
$effect(() => {
  if (!session.member || seeded) return;
  first = session.member.customFields?.["first-name"] ?? "";
  last = session.member.customFields?.["last-name"] ?? "";
  seeded = true;
});

const plans = $derived(
  session.member?.planConnections?.filter((plan) => plan.active) ?? []
);

async function save() {
  busy = true;
  saved = false;
  saveError = "";
  try {
    // updateMember takes the whole customFields object. Keys missing from
    // your dashboard are dropped silently, same as at signup.
    await getMemberstack().updateMember({
      customFields: { "first-name": first, "last-name": last },
    });
    await refresh();
    saved = true;
  } catch (err) {
    saveError = err?.message || "Could not save those changes.";
  }
  busy = false;
}
</script>

{#if session.error}
  <p class="notice">Could not reach Memberstack: {session.error}</p>
{:else if session.status === "in" && session.member}
  <div class="auth">
    <span class="eyebrow">Account</span>
    <h1>Your details</h1>
    <p class="sub">
      This reads and writes the same custom fields your signup form collected.
    </p>

    <div class="card">
      {#if saveError}<p class="err">{saveError}</p>{/if}
      {#if saved}<p class="ok">Saved.</p>{/if}

      <form onsubmit={(e) => { e.preventDefault(); save(); }}>
        <div class="row">
          <div>
            <label for="first">First name</label>
            <input id="first" bind:value={first} />
          </div>
          <div>
            <label for="last">Last name</label>
            <input id="last" bind:value={last} />
          </div>
        </div>

        <button type="submit" class="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>

    <div class="card" style="margin-top: 16px">
      <h2>Membership</h2>
      <dl class="dl">
        <div><dt>Email</dt><dd>{session.member.auth?.email}</dd></div>
        <div><dt>Member ID</dt><dd>{session.member.id}</dd></div>
        <div>
          <dt>Plan</dt>
          <dd>{plans.length ? plans.map((p) => p.planId).join(", ") : "None"}</dd>
        </div>
      </dl>

      {#if !plans.length}
        <p class="hint">
          No plan is needed — this site gates on being signed in. To gate on a
          plan instead, pass <code>plans</code> at signup or call
          <code>addPlan()</code>.
        </p>
      {/if}
    </div>
  </div>
{/if}
