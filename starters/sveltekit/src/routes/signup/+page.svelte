<script>
import { goto } from "$app/navigation";
import GoogleButton from "$lib/GoogleButton.svelte";
import { getMemberstack } from "$lib/memberstack";
import { refresh } from "$lib/member.svelte";

let error = $state("");
let busy = $state(false);
let firstName = $state("");
let lastName = $state("");
let email = $state("");
let password = $state("");

async function submit() {
  error = "";
  busy = true;
  try {
    await getMemberstack().signupMemberEmailPassword({
      email,
      password,
      /**
       * These two keys are not invented — every Memberstack app is created
       * with `first-name` and `last-name` custom fields already defined, so
       * they work with no dashboard setup.
       *
       * Note the kebab-case. Custom field keys are matched exactly, and a key
       * that does not exist in your dashboard is dropped SILENTLY: no error,
       * the value simply never arrives. If you add a field to this form,
       * create it in the dashboard first (Members -> Custom fields).
       */
      customFields: { "first-name": firstName, "last-name": lastName },
      /**
       * To put every new member on a plan, pass it here:
       *   plans: [{ planId: "pln_..." }]
       * Members are created fine without one, which is why this starter gates
       * on being signed in rather than on a plan.
       */
    });
    // Update the shared session before routing, or the nav arrives on the
    // next page still showing "Log in".
    await refresh();
    goto("/members");
  } catch (err) {
    // Signing up an address that already exists rejects here, which is the
    // single most common thing to hit while testing.
    error = err?.message || "Could not create that account.";
    busy = false;
  }
}
</script>

<div class="auth">
  <div class="card">
    <h1>Create your account</h1>
    <p class="sub">Free, and takes about ten seconds.</p>

    {#if error}<p class="err">{error}</p>{/if}

    <GoogleButton
      label="Continue with Google"
      onerror={(m) => (error = m)}
      onsignedin={async () => {
        await refresh();
        goto("/members");
      }}
    />

    <div class="or">or</div>

    <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
      <div class="row">
        <div>
          <label for="firstName">First name</label>
          <input id="firstName" bind:value={firstName} autocomplete="given-name" required />
        </div>
        <div>
          <label for="lastName">Last name</label>
          <input id="lastName" bind:value={lastName} autocomplete="family-name" required />
        </div>
      </div>

      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} autocomplete="email" required />

      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        autocomplete="new-password"
        minlength="8"
        required
      />

      <button type="submit" class="btn btn-primary" disabled={busy}>
        {busy ? "Creating your account…" : "Create account"}
      </button>
    </form>

    <p class="alt">Already have an account? <a href="/login">Log in</a></p>
  </div>
</div>
