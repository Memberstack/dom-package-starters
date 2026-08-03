import { Link } from "@remix-run/react";
import { site } from "../site.config";

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="8" fill="#e9f2ee" />
    <path
      d="M4.6 8.2l2.1 2.1 4.7-4.7"
      fill="none"
      stroke="#0f5c46"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M5 7V5.1a3 3 0 016 0V7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
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
);

/**
 * The public page. No session check here on purpose — a marketing page that
 * waits on auth before it renders is a marketing page that renders slowly.
 */
export default function Home() {
  return (
    <div className="hero">
      <div className="hero-copy">
        <span className="eyebrow">{site.tagline}</span>
        <h1>{site.hero.heading}</h1>
        <p>{site.hero.body}</p>

        <ul className="checks">
          {site.highlights.map((line) => (
            <li key={line}>
              <Check />
              {line}
            </li>
          ))}
        </ul>

        <Link to="/signup" className="btn btn-primary btn-lg">
          {site.hero.cta}
        </Link>
      </div>

      {/* Shows what is behind the login without giving it away. */}
      <div className="preview" aria-hidden="true">
        {site.resources.slice(0, 3).map((resource) => (
          <div className="card" key={resource.title}>
            <span className="kind">{resource.kind}</span>
            <h2>{resource.title}</h2>
            <p className="locked">
              <Lock />
              Members only
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
