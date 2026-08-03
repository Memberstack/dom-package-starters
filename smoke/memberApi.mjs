/**
 * Direct calls to the Memberstack client API, for setup and teardown only.
 *
 * Everything the test actually ASSERTS goes through the browser. This exists
 * so the member a run creates can be removed afterwards without a browser, and
 * therefore still be removed when a run dies half way through.
 *
 * Uses raw `fetch` rather than @memberstack/dom on purpose: the SDK's methods
 * reach for `window`, so importing it here fails with "window is not defined"
 * even though `init()` alone would be fine.
 */
const BASE = "https://client.memberstack.com";

const call = async (method, path, { key, token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": key,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // A non-JSON body is only interesting when the status already says failure.
  }
  return { status: res.status, json };
};

/**
 * Removes the test member if it is there, and says nothing if it is not.
 *
 * Called before the run as well as after it. Before, because a previous run
 * that crashed after signing up would otherwise leave an address that cannot
 * sign up again, and every run after it would fail on "already exists" -- a
 * failure that looks exactly like a broken starter and is not one.
 */
export const deleteTestMember = async ({ key, email, password }) => {
  const login = await call("POST", "/auth/login", {
    key,
    body: { email, password },
  });

  // No such member. That is the normal state at the start of a healthy run.
  if (login.status !== 200) return { removed: false };

  const token = login.json?.data?.tokens?.accessToken;
  const del = await call("DELETE", "/member", { key, token });

  if (del.status === 200) return { removed: true };

  // The one failure worth naming precisely. Apps ship with self-deletion off,
  // which is right for a real app and fatal for this test: without it the
  // member survives, and the NEXT run cannot sign up.
  const message = del.json?.message ?? `HTTP ${del.status}`;
  throw new Error(
    [
      `Could not delete the test member (${message}).`,
      "",
      "If that says to contact the website owner, the sandbox app has member",
      "self-deletion turned off. Turn it on for the CI app only:",
      "  Dashboard -> Settings -> Application -> Member accounts",
      '  -> "Allow members to delete their account."',
      "",
      "Without it this test can run exactly once, then every later run fails",
      "at signup because the address already exists.",
    ].join("\n")
  );
};
