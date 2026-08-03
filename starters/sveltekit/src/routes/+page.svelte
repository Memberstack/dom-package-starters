<script>
import { site } from "$lib/site.config";
</script>

<!-- The public page. No session check here on purpose — a marketing page that
     waits on auth before it renders is a marketing page that renders slowly. -->
<div class="hero">
  <div class="hero-copy">
    <span class="eyebrow">{site.tagline}</span>
    <h1>{site.hero.heading}</h1>
    <p>{site.hero.body}</p>

    <ul class="checks">
      {#each site.highlights as line (line)}
        <li>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="8" fill="#e9f2ee" />
            <path
              d="M4.6 8.2l2.1 2.1 4.7-4.7"
              fill="none"
              stroke="#0f5c46"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {line}
        </li>
      {/each}
    </ul>

    <a href="/signup" class="btn btn-primary btn-lg">{site.hero.cta}</a>
  </div>

  <!-- Shows what is behind the login without giving it away. -->
  <div class="preview" aria-hidden="true">
    {#each site.resources.slice(0, 3) as resource (resource.title)}
      <div class="card">
        <span class="kind">{resource.kind}</span>
        <h2>{resource.title}</h2>
        <p class="locked">
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M5 7V5.1a3 3 0 016 0V7"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
            <rect
              x="3.4"
              y="7"
              width="9.2"
              height="6.4"
              rx="1.9"
              fill="currentColor"
              opacity="0.55"
            />
          </svg>
          Members only
        </p>
      </div>
    {/each}
  </div>
</div>
