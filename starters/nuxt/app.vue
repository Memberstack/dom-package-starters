<script setup>
import { site } from "./site.config";

const { member, status, refresh } = useMember();
const { $memberstack } = useNuxtApp();
const route = useRoute();

// Resolve the session once, when the app mounts. Pages gated by the `gated`
// middleware may have resolved it already; refresh() is cheap and idempotent.
onMounted(() => {
  if (status.value === "loading") refresh();
});

useHead({ title: site.name });

const logout = async () => {
  await $memberstack.logout();
  await refresh();
  navigateTo("/");
};
</script>

<template>
  <header class="nav">
    <NuxtLink to="/" class="brand">{{ site.name }}</NuxtLink>

    <nav class="nav-links">
      <!--
        ClientOnly, because who is signed in is a fact only the browser has.
        The Memberstack SDK reads a cookie in the browser, so the server render
        can never know it and always emits the signed-out nav.

        Without this wrapper Nuxt logs "Hydration completed but contains
        mismatches": the `gated` middleware resolves the session during
        hydration, so the client renders a different nav than the server sent.
        Nuxt then patches the DOM, which is exactly the flicker this is meant to
        avoid.

        The fallback is deliberately empty rather than a signed-out nav — a
        member reloading a page should not see "Log in" for a frame.
      -->
      <ClientOnly>
        <template v-if="status === 'loading'" />
        <template v-else-if="member">
          <NuxtLink to="/members" :class="{ active: route.path === '/members' }">
            Members
          </NuxtLink>
          <NuxtLink to="/account" :class="{ active: route.path === '/account' }">
            Account
          </NuxtLink>
          <button type="button" class="btn btn-ghost" @click="logout">
            Log out
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/login">Log in</NuxtLink>
          <NuxtLink to="/signup" class="btn btn-primary btn-sm">Sign up</NuxtLink>
        </template>
      </ClientOnly>
    </nav>
  </header>

  <main>
    <NuxtPage />
  </main>

  <footer class="foot">
    <span>
      {{ site.name }} is a Memberstack starter. Replace
      <code>site.config.js</code> with your own and this becomes your site.
    </span>
  </footer>
</template>
