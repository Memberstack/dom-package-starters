import memberstackDOM from "@memberstack/dom";
import { environment } from "../environments/environment";

// Angular apps run in the browser, so this can initialise at module scope. If
// you add Angular SSR later, move it behind an isPlatformBrowser check: the SDK
// reads `window` as it initialises.
export const memberstack = memberstackDOM.init({
  publicKey: environment.memberstackPublicKey,
});
