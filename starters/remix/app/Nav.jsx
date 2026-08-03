import { Link, useLocation, useNavigate } from "@remix-run/react";
import { site } from "./site.config";
import { getMemberstack } from "./memberstack";
import { useMember } from "./useMember";

export default function Nav() {
  const { member, status, refresh } = useMember();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="nav">
      <Link to="/" className="brand">
        {site.name}
      </Link>

      <nav className="nav-links">
        {/* Rendering nothing while the session resolves keeps the nav from
            flickering "Log in" at a member who is already signed in. */}
        {status === "loading" ? null : member ? (
          <>
            <Link
              to="/members"
              className={pathname === "/members" ? "active" : undefined}
            >
              Members
            </Link>
            <Link
              to="/account"
              className={pathname === "/account" ? "active" : undefined}
            >
              Account
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={async () => {
                await getMemberstack().logout();
                await refresh();
                navigate("/");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
