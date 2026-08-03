import { Component, inject } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { site } from "../site.config";
import { MemberService } from "./member.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="nav">
      <a routerLink="/" class="brand">{{ site.name }}</a>

      <nav class="nav-links">
        <!-- Rendering nothing while the session resolves keeps the nav from
             flickering "Log in" at a member who is already signed in. -->
        @if (members.status() !== "loading") {
          @if (members.member()) {
            <a routerLink="/members" routerLinkActive="active">Members</a>
            <a routerLink="/account" routerLinkActive="active">Account</a>
            <button type="button" class="btn btn-ghost" (click)="logout()">
              Log out
            </button>
          } @else {
            <a routerLink="/login">Log in</a>
            <a routerLink="/signup" class="btn btn-primary btn-sm">Sign up</a>
          }
        }
      </nav>
    </header>

    <main><router-outlet /></main>

    <footer class="foot">
      <span>
        {{ site.name }} is a Memberstack starter. Replace
        <code>site.config.ts</code> with your own and this becomes your site.
      </span>
    </footer>
  `,
})
export class AppComponent {
  readonly members = inject(MemberService);
  private readonly router = inject(Router);
  readonly site = site;

  constructor() {
    // index.html is static, so the tab title comes from site.config here
    // rather than being hardcoded in two places that can drift apart.
    inject(Title).setTitle(site.name);

    // Resolve the session once at startup. Gated routes may have resolved it
    // already via the guard; refresh() is cheap and idempotent.
    if (this.members.status() === "loading") this.members.refresh();
  }

  async logout() {
    await this.members.logout();
    this.router.navigate(["/"]);
  }
}
