import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { GoogleButtonComponent } from "./google-button.component";
import { MemberService } from "./member.service";
import { memberstack } from "./memberstack";

@Component({
  selector: "app-signup",
  standalone: true,
  imports: [FormsModule, RouterLink, GoogleButtonComponent],
  template: `
    <div class="auth">
      <div class="card">
        <h1>Create your account</h1>
        <p class="sub">Free, and takes about ten seconds.</p>

        @if (error) { <p class="err">{{ error }}</p> }

        <google-button
          label="Continue with Google"
          (failed)="error = $event"
          (signedIn)="afterGoogle()"
        />

        <div class="or">or</div>

        <form (ngSubmit)="submit()">
          <div class="row">
            <div>
              <label for="firstName">First name</label>
              <input id="firstName" name="firstName" [(ngModel)]="firstName"
                     autocomplete="given-name" required />
            </div>
            <div>
              <label for="lastName">Last name</label>
              <input id="lastName" name="lastName" [(ngModel)]="lastName"
                     autocomplete="family-name" required />
            </div>
          </div>

          <label for="email">Email</label>
          <input id="email" name="email" type="email" [(ngModel)]="email"
                 autocomplete="email" required />

          <label for="password">Password</label>
          <input id="password" name="password" type="password" [(ngModel)]="password"
                 autocomplete="new-password" minlength="8" required />

          <button type="submit" class="btn btn-primary" [disabled]="busy">
            {{ busy ? "Creating your account…" : "Create account" }}
          </button>
        </form>

        <p class="alt">Already have an account? <a routerLink="/login">Log in</a></p>
      </div>
    </div>
  `,
})
export class SignupComponent {
  private readonly members = inject(MemberService);
  private readonly router = inject(Router);

  firstName = "";
  lastName = "";
  email = "";
  password = "";
  error = "";
  busy = false;

  /**
   * Google returns via a popup, so this page is still on screen when it
   * resolves. Refresh the shared session (so the nav updates) and move on.
   */
  async afterGoogle() {
    await this.members.refresh();
    this.router.navigate(["/members"]);
  }

  async submit() {
    this.error = "";
    this.busy = true;
    try {
      await memberstack.signupMemberEmailPassword({
        email: this.email,
        password: this.password,
        /**
         * These two keys are not invented — every Memberstack app is created
         * with `first-name` and `last-name` custom fields already defined, so
         * they work with no dashboard setup.
         *
         * Note the kebab-case. Custom field keys are matched exactly, and a key
         * that does not exist in your dashboard is dropped SILENTLY: no error,
         * the value simply never arrives. If you add a field to this form,
         * create it in the dashboard first (Members -> Custom fields).
         */
        customFields: {
          "first-name": this.firstName,
          "last-name": this.lastName,
        },
        /**
         * To put every new member on a plan, pass it here:
         *   plans: [{ planId: "pln_..." }]
         * Members are created fine without one, which is why this starter gates
         * on being signed in rather than on a plan.
         */
      });
      // Update the shared session before routing, or the nav arrives on the
      // next page still showing "Log in".
      await this.members.refresh();
      this.router.navigate(["/members"]);
    } catch (err: any) {
      // Signing up an address that already exists rejects here, which is the
      // single most common thing to hit while testing.
      this.error = err?.message || "Could not create that account.";
      this.busy = false;
    }
  }
}
