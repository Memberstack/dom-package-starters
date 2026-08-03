import type { Routes } from "@angular/router";
import { AccountComponent } from "./account.component";
import { gatedGuard } from "./gated.guard";
import { HomeComponent } from "./home.component";
import { LoginComponent } from "./login.component";
import { MembersComponent } from "./members.component";
import { SignupComponent } from "./signup.component";

export const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "signup", component: SignupComponent },
  { path: "login", component: LoginComponent },

  // canActivate runs BEFORE the component is created, so a signed-out visitor
  // never renders these at all. See gated.guard.ts.
  { path: "members", component: MembersComponent, canActivate: [gatedGuard] },
  { path: "account", component: AccountComponent, canActivate: [gatedGuard] },

  // Anything else goes home rather than showing a blank router outlet.
  { path: "**", redirectTo: "" },
];
