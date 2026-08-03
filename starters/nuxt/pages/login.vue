<script setup>
const { $memberstack } = useNuxtApp();
const { refresh } = useMember();

const error = ref("");
const busy = ref(false);
const email = ref("");
const password = ref("");
const code = ref("");
// "password" | "code-sent"
const mode = ref("password");

/**
 * Passwordless login, in two steps: Memberstack emails a one-time code, the
 * member types it back in. Adoption of this roughly triples between small apps
 * and large ones, which is why it is wired up rather than left as an exercise.
 *
 * It is OFF on a new app. Turn it on in the dashboard under Authentication, or
 * the request below comes back with an error saying so.
 */
const requestCode = async () => {
  error.value = "";
  if (!email.value) {
    error.value = "Enter your email first, then request a code.";
    return;
  }
  busy.value = true;
  try {
    await $memberstack.sendMemberLoginPasswordlessEmail({ email: email.value });
    mode.value = "code-sent";
  } catch (err) {
    error.value =
      err?.message ||
      "Could not send a code. Passwordless may be off for this app.";
  }
  busy.value = false;
};

const submitCode = async () => {
  error.value = "";
  busy.value = true;
  try {
    await $memberstack.loginMemberPasswordless({
      email: email.value,
      passwordlessToken: code.value,
    });
    await refresh();
    navigateTo("/members");
  } catch (err) {
    error.value =
      err?.message || "That code did not work. Try requesting a new one.";
    busy.value = false;
  }
};

const submitPassword = async () => {
  error.value = "";
  busy.value = true;
  try {
    await $memberstack.loginMemberEmailPassword({
      email: email.value,
      password: password.value,
    });
    await refresh();
    navigateTo("/members");
  } catch (err) {
    error.value = err?.message || "That email and password did not match.";
    busy.value = false;
  }
};
/**
 * Google returns via a popup, so this page is still on screen when it resolves.
 * Refresh the shared session (so the nav updates) and move the visitor on.
 */
const afterGoogle = async () => {
  await refresh();
  navigateTo("/members");
};
</script>

<template>
  <div class="auth">
    <div class="card">
      <h1>Welcome back</h1>
      <p class="sub">Log in to reach your library.</p>

      <p v-if="error" class="err">{{ error }}</p>

      <template v-if="mode === 'code-sent'">
        <p class="ok">We emailed a one-time code to {{ email }}.</p>
        <form @submit.prevent="submitCode">
          <label for="code">Your code</label>
          <input id="code" v-model="code" inputmode="numeric" required />
          <button type="submit" class="btn btn-primary" :disabled="busy">
            {{ busy ? "Checking…" : "Log in" }}
          </button>
        </form>
        <p class="alt">
          <button type="button" class="linkish" @click="mode = 'password'; error = ''">
            Use a password instead
          </button>
        </p>
      </template>

      <template v-else>
        <GoogleButton
          label="Continue with Google"
          @error="error = $event"
          @signedin="afterGoogle"
        />

        <div class="or">or</div>

        <form @submit.prevent="submitPassword">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" autocomplete="email" required />

          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />

          <button type="submit" class="btn btn-primary" :disabled="busy">
            {{ busy ? "Logging in…" : "Log in" }}
          </button>
        </form>

        <p class="alt">
          <button type="button" class="linkish" :disabled="busy" @click="requestCode">
            Email me a code instead
          </button>
        </p>
      </template>

      <p class="alt">
        New here? <NuxtLink to="/signup">Create an account</NuxtLink>
      </p>
    </div>
  </div>
</template>
