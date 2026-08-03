import { site } from "../site.config";
import "./globals.css";
import MemberProvider from "./MemberProvider";
import Nav from "./Nav";

export const metadata = {
  title: site.name,
  description: site.tagline,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MemberProvider>
          <Nav />
          <main>{children}</main>
        </MemberProvider>
        <footer className="foot">
          <span>
            {site.name} is a Memberstack starter. Replace{" "}
            <code>site.config.js</code> with your own and this becomes your
            site.
          </span>
        </footer>
      </body>
    </html>
  );
}
