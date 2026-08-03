<script>
import { requireMember } from "$lib/guard.svelte";
import { site } from "$lib/site.config";

// Route protection lives in one place. See src/lib/guard.svelte.js.
const session = requireMember();

const firstName = $derived(session.member?.customFields?.["first-name"]);
</script>

{#if session.error}
  <!-- A bad public key surfaces here rather than as a blank page that never
       resolves. This is the difference between "five minutes" and "an
       afternoon" when the key is wrong. -->
  <p class="notice">
    Could not reach Memberstack: {session.error}<br />
    Check <code>PUBLIC_MEMBERSTACK_PUBLIC_KEY</code> in <code>.env.local</code>.
  </p>
{:else if session.status === "in" && session.member}
  <!-- "loading" and "out" both render nothing: one is about to resolve, the
       other is about to redirect. -->
  <span class="eyebrow">Members</span>
  <h1>{firstName ? `Welcome back, ${firstName}.` : "Welcome back."}</h1>
  <p class="sub">
    Everything below is behind the login. Signed out visitors get sent to the
    login page.
  </p>

  <div class="grid">
    {#each site.resources as resource (resource.title)}
      <article class="card">
        <span class="kind">{resource.kind}</span>
        <h2>{resource.title}</h2>
        <p>{resource.body}</p>
      </article>
    {/each}
  </div>
{/if}
