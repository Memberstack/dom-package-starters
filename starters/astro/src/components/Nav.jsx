import { site } from "../site.config";
import { memberstack } from "./memberstack";
import { useMember } from "./useMember";

/**
 * The nav is an island because it changes with the session.
 *
 * `pathname` comes in as a prop from the .astro page rather than being read
 * here: the page already knows it at build time, so there is no reason to ask
 * the browser.
 */
export default function Nav({ pathname }) {
  // Astro's build emits directory-style URLs (/members/), while dev serves
  // /members. Normalising here keeps the active state working in both, instead
  // of silently doing nothing in production only.
  const path = pathname.replace(/\/+$/, "") || "/";
  const { member, status, refresh } = useMember();

  return (
    <nav className="nav-links">
      {/* Rendering nothing while the session resolves keeps the nav from
          flickering "Log in" at a member who is already signed in. */}
      {status === "loading" ? null : member ? (
        <>
          <a
            href="/members"
            className={path === "/members" ? "active" : undefined}
          >
            Members
          </a>
          <a
            href="/account"
            className={path === "/account" ? "active" : undefined}
          >
            Account
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await memberstack.logout();
              await refresh();
              // A full load, not a history push: every island on the next page
              // re-reads the session, which is how this starter stays in sync
              // without shared state.
              window.location.href = "/";
            }}
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <a href="/login">Log in</a>
          <a href="/signup" className="btn btn-primary btn-sm">
            Sign up
          </a>
        </>
      )}
    </nav>
  );
}
