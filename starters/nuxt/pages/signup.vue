<script setup>
const { $memberstack } = useNuxtApp();
const { refresh } = useMember();

const error = ref("");
const busy = ref(false);
const form = reactive({ firstName: "", lastName: "", email: "", password: "" });

const submit = async () => {
  error.value = "";
  busy.value = true;
  try {
    await $memberstack.signupMemberEmailPassword({
      email: form.email,
      password: form.password,
      /**
       * These two keys are not invented — every Memberstack app is created
       * with `first-name` and `last-name` custom fields already defined, so
       * they work with no dashboard setup.
       *
       * Note the kebab-case. Custom field keys are matched exactly, and a key
       * that does not exist in your dashboard is dropped SILENTLY: no error,
       * the value simply never arrives. If you add a field to this form,
       * create it in the dashboard first (Members -> Custom fields) or you
       * will be debugging a value that vanishes without a trace.
       */
      customFields: {
        "first-name": form.firstName,
        "last-name": form.lastName,
      },
      /**
       * To put every new member on a plan, pass it here:
       *   plans: [{ planId: "pln_..." }]
       * Members are created fine without one, which is why this starter gates
       * on being signed in rather than on a plan.
       */
    });
    // Update the shared session before routing, or the nav arrives on the next
    // page still showing "Log in".
    await refresh();
    navigateTo("/members");
  } catch (err) {
    // Signing up an address that already exists rejects here, which is the
    // single most common thing to hit while testing.
    error.value = err?.message || "Could not create that account.";
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
      <h1>Create your account</h1>
      <p class="sub">Free, and takes about ten seconds.</p>

      <p v-if="error" class="err">{{ error }}</p>

      <GoogleButton
          label="Continue with Google"
          @error="error = $event"
          @signedin="afterGoogle"
        />

      <div class="or">or</div>

      <form @submit.prevent="submit">
        <div class="row">
          <div>
            <label for="firstName">First name</label>
            <input id="firstName" v-model="form.firstName" autocomplete="given-name" required />
          </div>
          <div>
            <label for="lastName">Last name</label>
            <input id="lastName" v-model="form.lastName" autocomplete="family-name" required />
          </div>
        </div>

        <label for="email">Email</label>
        <input id="email" v-model="form.email" type="email" autocomplete="email" required />

        <label for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
        />

        <button type="submit" class="btn btn-primary" :disabled="busy">
          {{ busy ? "Creating your account…" : "Create account" }}
        </button>
      </form>

      <p class="alt">
        Already have an account? <NuxtLink to="/login">Log in</NuxtLink>
      </p>
    </div>
  </div>
</template>
