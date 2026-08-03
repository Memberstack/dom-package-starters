<script setup>
/**
 * Google sign-in.
 *
 * This works the moment you run the starter — Google is enabled on every new
 * Memberstack app by default, using Memberstack's own OAuth credentials, so
 * there is no Google Cloud project to create first. Two thirds of live
 * Memberstack sites offer it, which is why it is here rather than in the README.
 *
 * `allowSignup: true` means one button covers both cases: an existing member
 * signs in, a new one gets an account. That is why the same component sits on
 * the login and signup pages.
 */
defineProps({ label: { type: String, required: true } });
const emit = defineEmits(["error", "signedin"]);
const { $memberstack } = useNuxtApp();

const go = async () => {
  try {
    await $memberstack.loginWithProvider({
      provider: "google",
      allowSignup: true,
    });
    // The popup is gone and the session exists, but this page has not moved.
    emit("signedin");
  } catch (err) {
    // A closed popup rejects here too, so this is not always worth shouting
    // about — but silence would leave the button looking broken.
    emit("error", err?.message || "Google sign-in did not complete.");
  }
};
</script>

<template>
  <button type="button" class="btn btn-google" @click="go">
    <svg viewBox="0 0 18 18" aria-hidden="true" width="18" height="18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
    {{ label }}
  </button>
</template>
