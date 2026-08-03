import { site } from "../site.config";
import { useRequireMember } from "./useMember";

export default function MembersArea() {
  const { member, status, error } = useRequireMember();

  // A bad public key surfaces here rather than as a blank page that never
  // resolves. This is the difference between "five minutes" and "an afternoon"
  // when the key is wrong.
  if (error) {
    return (
      <p className="notice">
        Could not reach Memberstack: {error}
        <br />
        Check <code>PUBLIC_MEMBERSTACK_PUBLIC_KEY</code> in{" "}
        <code>.env.local</code>.
      </p>
    );
  }

  // "loading" and "out" both render nothing: one is about to resolve, the other
  // is about to redirect. Rendering the page for either is what causes gated
  // content to flash before it disappears.
  if (status !== "in" || !member) return null;

  const firstName = member.customFields?.["first-name"];

  return (
    <>
      <span className="eyebrow">Members</span>
      <h1>{firstName ? `Welcome back, ${firstName}.` : "Welcome back."}</h1>
      <p className="sub">
        Everything below is behind the login. Signed out visitors get sent to
        the login page.
      </p>

      <div className="grid">
        {site.resources.map((resource) => (
          <article className="card" key={resource.title}>
            <span className="kind">{resource.kind}</span>
            <h2>{resource.title}</h2>
            <p>{resource.body}</p>
          </article>
        ))}
      </div>
    </>
  );
}
