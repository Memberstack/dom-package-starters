<script>
import { goto } from "$app/navigation";
import GoogleButton from "$lib/GoogleButton.svelte";
import { getMemberstack } from "$lib/memberstack";
import { refresh } from "$lib/member.svelte";

let error = $state("");
let busy = $state(false);
let email = $state("");
let password = $state("");
let code = $state("");
// "password" | "code-sent"
let mode = $state("password");

/**
 * Passwordless login, in two steps: Memberstack emails a one-time code, the
 * member types it back in. Adoption of this roughly triples between small
 * apps and large ones, which is why it is wired up rather than left as an
 * exercise.
 *
 * It is OFF on a new app. Turn it on in the dashboard under Authentication,
 * or the request below comes back with an error saying so.
 */
async function requestCode() {
  error = "";
  if (!email) {
    error = "Enter your email first, then request a code.";
    return;
  }
  busy = true;
  try {
    await getMemberstack().sendMemberLoginPasswordlessEmail({ email });
    mode = "code-sent";
  } catch (err) {
    error =
      err?.message ||
      "Could not send a code. Passwordless may be off for this app.";
  }
  busy = false;
}

async function submitCode() {
  error = "";
  busy = true;
  try {
    await getMemberstack().loginMemberPasswordless({
      email,
      passwordlessToken: code,
    });
    await refresh();
    goto("/members");
  } catch (err) {
    error = err?.message || "That code did not work. Try requesting a new one.";
    busy = false;
  }
}

async function submitPassword() {
  error = "";
  busy = true;
  try {
    await getMemberstack().loginMemberEmailPassword({ email, password });
    await refresh();
    goto("/members");
  } catch (err) {
    error = err?.message || "That email and password did not match.";
    busy = false;
  }
}
</script>

<div class="auth">
  <div class="card">
    <h1>Welcome back</h1>
    <p class="sub">Log in to reach your library.</p>

    {#if error}<p class="err">{error}</p>{/if}

    {#if mode === "code-sent"}
      <p class="ok">We emailed a one-time code to {email}.</p>
      <form onsubmit={(e) => { e.preventDefault(); submitCode(); }}>
        <label for="code">Your code</label>
        <input id="code" bind:value={code} inputmode="numeric" required />
        <button type="submit" class="btn btn-primary" disabled={busy}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </form>
      <p class="alt">
        <button type="button" class="linkish" onclick={() => { mode = "password"; error = ""; }}>
          Use a password instead
        </button>
      </p>
    {:else}
      <GoogleButton
      label="Continue with Google"
      onerror={(m) => (error = m)}
      onsignedin={async () => {
        await refresh();
        goto("/members");
      }}
    />

      <div class="or">or</div>

      <form onsubmit={(e) => { e.preventDefault(); submitPassword(); }}>
        <label for="email">Email</label>
        <input id="email" type="email" bind:value={email} autocomplete="email" required />

        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          autocomplete="current-password"
          required
        />

        <button type="submit" class="btn btn-primary" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p class="alt">
        <button type="button" class="linkish" disabled={busy} onclick={requestCode}>
          Email me a code instead
        </button>
      </p>
    {/if}

    <p class="alt">New here? <a href="/signup">Create an account</a></p>
  </div>
</div>
