import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { createSignal, onMount, onCleanup, Suspense } from "solid-js";
import "./app.css";

function ShutdownBanner() {
  const END = new Date("2026-07-18T00:00:00Z").getTime();
  const [remaining, setRemaining] = createSignal("3d 0h 0m 0s");

  onMount(() => {
    function tick() {
      const diff = END - Date.now();
      if (diff <= 0) {
        setRemaining("0d 0h 0m 0s");
        interval && clearInterval(interval);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${d}d ${h}h ${m}m ${s}s`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="shutdown-banner">
      This tool's hosting will end in {remaining()}
    </div>
  );
}

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>BDSMLR RSS</Title>
          <ShutdownBanner />
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
