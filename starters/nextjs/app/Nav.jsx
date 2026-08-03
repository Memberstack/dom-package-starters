"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { site } from "../site.config";
import { getMemberstack } from "./memberstack";
import { useMember } from "./useMember";

export default function Nav() {
  const { member, status, refresh } = useMember();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="nav">
      <Link href="/" className="brand">
        {site.name}
      </Link>

      <nav className="nav-links">
        {/* Rendering nothing while the session resolves keeps the nav from
            flickering "Log in" at a member who is already signed in. */}
        {status === "loading" ? null : member ? (
          <>
            <Link
              href="/members"
              className={pathname === "/members" ? "active" : undefined}
            >
              Members
            </Link>
            <Link
              href="/account"
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
                router.push("/");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
