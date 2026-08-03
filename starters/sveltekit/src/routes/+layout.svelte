<script>
import { goto } from "$app/navigation";
import { page } from "$app/state";
import "../style.css";
import { getMemberstack } from "$lib/memberstack";
import { refresh, session } from "$lib/member.svelte";
import { site } from "$lib/site.config";

let { children } = $props();

// Resolve the session once, in the browser.
$effect(() => {
  if (session.status === "loading") refresh();
});

async function logout() {
  await getMemberstack().logout();
  await refresh();
  goto("/");
}
</script>

<svelte:head><title>{site.name}</title></svelte:head>

<header class="nav">
  <a href="/" class="brand">{site.name}</a>

  <nav class="nav-links">
    <!-- Rendering nothing while the session resolves keeps the nav from
         flickering "Log in" at a member who is already signed in. -->
    {#if session.status !== "loading"}
      {#if session.member}
        <a href="/members" class={page.url.pathname === "/members" ? "active" : ""}>
          Members
        </a>
        <a href="/account" class={page.url.pathname === "/account" ? "active" : ""}>
          Account
        </a>
        <button type="button" class="btn btn-ghost" onclick={logout}>Log out</button>
      {:else}
        <a href="/login">Log in</a>
        <a href="/signup" class="btn btn-primary btn-sm">Sign up</a>
      {/if}
    {/if}
  </nav>
</header>

<main>{@render children()}</main>

<footer class="foot">
  <span>
    {site.name} is a Memberstack starter. Replace <code>site.config.js</code>
    with your own and this becomes your site.
  </span>
</footer>
