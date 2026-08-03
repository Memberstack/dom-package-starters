import { Injectable, signal } from "@angular/core";
import { memberstack } from "./memberstack";

export type SessionStatus = "loading" | "in" | "out";

/**
 * One session for the whole app.
 *
 * A root-provided service is Angular's shared-state answer: every component
 * that injects it reads the same signals, so signing in updates the nav and the
 * page together. The React starter needs a context provider to do this; here
 * the injector does it.
 *
 * status is "loading" | "in" | "out" — three states, not two. A member object
 * alone cannot tell "signed out" apart from "we have not asked yet", and
 * conflating them is what makes a gated page flash its contents before it
 * redirects.
 */
@Injectable({ providedIn: "root" })
export class MemberService {
  readonly member = signal<any>(null);
  readonly status = signal<SessionStatus>("loading");
  readonly error = signal("");

  async refresh(): Promise<SessionStatus> {
    try {
      const { data } = await memberstack.getCurrentMember();
      this.member.set(data ?? null);
      this.status.set(data ? "in" : "out");
      this.error.set("");
    } catch (err: any) {
      // Almost always a bad public key. Without this the app renders a
      // permanently blank page with nothing on screen to explain why.
      this.member.set(null);
      this.status.set("out");
      this.error.set(err?.message || "Could not reach Memberstack.");
    }
    return this.status();
  }

  async logout() {
    await memberstack.logout();
    await this.refresh();
  }

  /** Convenience for templates: the member's first name, if it is set. */
  firstName(): string | undefined {
    return this.member()?.customFields?.["first-name"];
  }
}
