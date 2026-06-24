import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>BDSMLR RSS</Title>
          <header class="site-header">
            <a
              href="https://github.com/zastraeaxyz/bdsmlr-rss"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </header>
          <Suspense>{props.children}</Suspense>
          <footer class="site-footer">
            <p>
              No data is collected. Queries are not tied to the tokens used for
              viewing private blogs.
            </p>
          </footer>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
