import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MemberService } from "./member.service";
import { memberstack } from "./memberstack";

@Component({
  selector: "app-account",
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (members.error()) {
      <p class="notice">Could not reach Memberstack: {{ members.error() }}</p>
    } @else {
      @if (members.member(); as member) {
      <div class="auth">
        <span class="eyebrow">Account</span>
        <h1>Your details</h1>
        <p class="sub">
          This reads and writes the same custom fields your signup form collected.
        </p>

        <div class="card">
          @if (saveError) { <p class="err">{{ saveError }}</p> }
          @if (saved) { <p class="ok">Saved.</p> }

          <form (ngSubmit)="save()">
            <div class="row">
              <div>
                <label for="first">First name</label>
                <input id="first" name="first" [(ngModel)]="first" />
              </div>
              <div>
                <label for="last">Last name</label>
                <input id="last" name="last" [(ngModel)]="last" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="busy">
              {{ busy ? "Saving…" : "Save changes" }}
            </button>
          </form>
        </div>

        <div class="card" style="margin-top: 16px">
          <h2>Membership</h2>
          <dl class="dl">
            <div><dt>Email</dt><dd>{{ member.auth?.email }}</dd></div>
            <div><dt>Member ID</dt><dd>{{ member.id }}</dd></div>
            <div><dt>Plan</dt><dd>{{ planLabel() }}</dd></div>
          </dl>

          @if (!activePlans().length) {
            <p class="hint">
              No plan is needed — this site gates on being signed in. To gate on
              a plan instead, pass <code>plans</code> at signup or call
              <code>addPlan()</code>.
            </p>
          }
        </div>
      </div>
      }
    }
  `,
})
export class AccountComponent implements OnInit {
  readonly members = inject(MemberService);

  first = "";
  last = "";
  saved = false;
  saveError = "";
  busy = false;

  // Seeded once, on init. Re-seeding on every change would clobber whatever the
  // person is typing.
  ngOnInit() {
    const fields = this.members.member()?.customFields ?? {};
    this.first = fields["first-name"] ?? "";
    this.last = fields["last-name"] ?? "";
  }

  activePlans(): any[] {
    return this.members.member()?.planConnections?.filter((p: any) => p.active) ?? [];
  }

  planLabel(): string {
    const plans = this.activePlans();
    return plans.length ? plans.map((p: any) => p.planId).join(", ") : "None";
  }

  async save() {
    this.busy = true;
    this.saved = false;
    this.saveError = "";
    try {
      // updateMember takes the whole customFields object. Keys missing from
      // your dashboard are dropped silently, same as at signup.
      await memberstack.updateMember({
        customFields: { "first-name": this.first, "last-name": this.last },
      });
      await this.members.refresh();
      this.saved = true;
    } catch (err: any) {
      this.saveError = err?.message || "Could not save those changes.";
    }
    this.busy = false;
  }
}
