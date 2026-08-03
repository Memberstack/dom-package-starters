import { Links, Meta, Outlet, Scripts } from "@remix-run/react";
import MemberProvider from "./MemberProvider";
import Nav from "./Nav";
import { site } from "./site.config";
import "./style.css";

export const meta = () => [
  { title: site.name },
  { name: "description", content: site.tagline },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <MemberProvider>
          <Nav />
          <main>
            <Outlet />
          </main>
        </MemberProvider>
        <footer className="foot">
          <span>
            {site.name} is a Memberstack starter. Replace{" "}
            <code>site.config.js</code> with your own and this becomes your
            site.
          </span>
        </footer>
        <Scripts />
      </body>
    </html>
  );
}
