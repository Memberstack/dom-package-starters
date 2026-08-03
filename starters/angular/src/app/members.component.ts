import { Component, inject } from "@angular/core";
import { site } from "../site.config";
import { MemberService } from "./member.service";

@Component({
  selector: "app-members",
  standalone: true,
  template: `
    <!-- A bad public key surfaces here rather than as a blank page that never
         resolves. The guard lets this route through when the SDK failed, so the
         cause stays on screen instead of being replaced by a login form. -->
    @if (members.error()) {
      <p class="notice">
        Could not reach Memberstack: {{ members.error() }}<br />
        Check <code>memberstackPublicKey</code> in
        <code>src/environments/environment.ts</code>.
      </p>
    } @else if (members.member()) {
      <span class="eyebrow">Members</span>
      <h1>
        {{ members.firstName() ? "Welcome back, " + members.firstName() + "." : "Welcome back." }}
      </h1>
      <p class="sub">
        Everything below is behind the login. Signed out visitors get sent to
        the login page.
      </p>

      <div class="grid">
        @for (resource of site.resources; track resource.title) {
          <article class="card">
            <span class="kind">{{ resource.kind }}</span>
            <h2>{{ resource.title }}</h2>
            <p>{{ resource.body }}</p>
          </article>
        }
      </div>
    }
  `,
})
export class MembersComponent {
  readonly members = inject(MemberService);
  readonly site = site;
}
