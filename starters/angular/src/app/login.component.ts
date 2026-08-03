import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { GoogleButtonComponent } from "./google-button.component";
import { MemberService } from "./member.service";
import { memberstack } from "./memberstack";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, RouterLink, GoogleButtonComponent],
  template: `
    <div class="auth">
      <div class="card">
        <h1>Welcome back</h1>
        <p class="sub">Log in to reach your library.</p>

        @if (error) { <p class="err">{{ error }}</p> }

        @if (mode === "code-sent") {
          <p class="ok">We emailed a one-time code to {{ email }}.</p>
          <form (ngSubmit)="submitCode()">
            <label for="code">Your code</label>
            <input id="code" name="code" [(ngModel)]="code" inputmode="numeric" required />
            <button type="submit" class="btn btn-primary" [disabled]="busy">
              {{ busy ? "Checking…" : "Log in" }}
            </button>
          </form>
          <p class="alt">
            <button type="button" class="linkish" (click)="mode = 'password'; error = ''">
              Use a password instead
            </button>
          </p>
        } @else {
          <google-button
          label="Continue with Google"
          (failed)="error = $event"
          (signedIn)="afterGoogle()"
        />

          <div class="or">or</div>

          <form (ngSubmit)="submitPassword()">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" [(ngModel)]="email"
                   autocomplete="email" required />

            <label for="password">Password</label>
            <input id="password" name="password" type="password" [(ngModel)]="password"
                   autocomplete="current-password" required />

            <button type="submit" class="btn btn-primary" [disabled]="busy">
              {{ busy ? "Logging in…" : "Log in" }}
            </button>
          </form>

          <p class="alt">
            <button type="button" class="linkish" [disabled]="busy" (click)="requestCode()">
              Email me a code instead
            </button>
          </p>
        }

        <p class="alt">New here? <a routerLink="/signup">Create an account</a></p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly members = inject(MemberService);
  private readonly router = inject(Router);

  email = "";
  password = "";
  code = "";
  error = "";
  busy = false;
  mode: "password" | "code-sent" = "password";

  /**
   * Passwordless login, in two steps: Memberstack emails a one-time code, the
   * member types it back in. Adoption of this roughly triples between small
   * apps and large ones, which is why it is wired up rather than left as an
   * exercise.
   *
   * It is OFF on a new app. Turn it on in the dashboard under Authentication,
   * or the request below comes back with an error saying so.
   */
  /**
   * Google returns via a popup, so this page is still on screen when it
   * resolves. Refresh the shared session (so the nav updates) and move on.
   */
  async afterGoogle() {
    await this.members.refresh();
    this.router.navigate(["/members"]);
  }

  async requestCode() {
    this.error = "";
    if (!this.email) {
      this.error = "Enter your email first, then request a code.";
      return;
    }
    this.busy = true;
    try {
      await memberstack.sendMemberLoginPasswordlessEmail({ email: this.email });
      this.mode = "code-sent";
    } catch (err: any) {
      this.error =
        err?.message || "Could not send a code. Passwordless may be off for this app.";
    }
    this.busy = false;
  }

  async submitCode() {
    this.error = "";
    this.busy = true;
    try {
      await memberstack.loginMemberPasswordless({
        email: this.email,
        passwordlessToken: this.code,
      });
      await this.members.refresh();
      this.router.navigate(["/members"]);
    } catch (err: any) {
      this.error = err?.message || "That code did not work. Try requesting a new one.";
      this.busy = false;
    }
  }

  async submitPassword() {
    this.error = "";
    this.busy = true;
    try {
      await memberstack.loginMemberEmailPassword({
        email: this.email,
        password: this.password,
      });
      await this.members.refresh();
      this.router.navigate(["/members"]);
    } catch (err: any) {
      this.error = err?.message || "That email and password did not match.";
      this.busy = false;
    }
  }
}
