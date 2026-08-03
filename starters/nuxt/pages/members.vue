<script setup>
import { site } from "../site.config";

// Route protection lives in one place. See middleware/gated.js.
definePageMeta({ middleware: "gated" });

const { member, status, error } = useMember();

const firstName = computed(() => member.value?.customFields?.["first-name"]);
</script>

<template>
  <!--
    ClientOnly for the same reason the nav in app.vue has it: who is signed in
    is a fact only the browser has. The server always renders the signed-out
    branch (nothing), while the client has usually resolved the session by
    hydration time via the `gated` middleware, so the two disagree.

    Without this Nuxt logs "Hydration completed but contains mismatches" and
    patches the DOM, which is the flicker the wrapper exists to avoid. It is
    a warning rather than an error, so it costs nothing visible in a build and
    shows up in every customer's console.

    Empty fallback on purpose: a member reloading this page should see nothing
    for a frame rather than a flash of the signed-out state.
  -->
  <ClientOnly>
    <!-- A bad public key surfaces here rather than as a blank page that never
         resolves. This is the difference between "five minutes" and "an
         afternoon" when the key is wrong. -->
    <p v-if="error" class="notice">
      Could not reach Memberstack: {{ error }}<br />
      Check <code>NUXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY</code> in <code>.env</code>.
    </p>

    <!-- "loading" and "out" both render nothing: one is about to resolve, the
         other is about to redirect. -->
    <template v-else-if="status === 'in' && member">
      <span class="eyebrow">Members</span>
      <h1>{{ firstName ? `Welcome back, ${firstName}.` : "Welcome back." }}</h1>
      <p class="sub">
        Everything below is behind the login. Signed out visitors get sent to
        the login page.
      </p>

      <div class="grid">
        <article v-for="resource in site.resources" :key="resource.title" class="card">
          <span class="kind">{{ resource.kind }}</span>
          <h2>{{ resource.title }}</h2>
          <p>{{ resource.body }}</p>
        </article>
      </div>
    </template>
  </ClientOnly>
</template>
