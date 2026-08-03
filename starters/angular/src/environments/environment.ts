// Angular has no .env file. Configuration lives here and is compiled into the
// bundle. A public key is meant to be visible in front-end code, so this is the
// right place for it, but note that unlike the other starters this file IS
// committed. Nothing that must stay private belongs in this folder: it is both
// pushed to your repo and published in your JavaScript.
//
// THIS IS THE FILE `ng build` USES, so this is where your Live key goes when
// you launch. `ng serve` uses environment.development.ts instead, which keeps
// local development on test members afterwards.
//
// Test keys start pk_sb_, live keys start pk_. Swap in your Live key
// from Dev Tools before you launch.
export const environment = {
  memberstackPublicKey: "__MEMBERSTACK_PUBLIC_KEY__",
};
