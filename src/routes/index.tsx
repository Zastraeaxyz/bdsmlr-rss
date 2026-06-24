import { Title } from "@solidjs/meta";
import { useLocation } from "@solidjs/router";
import {
  createSignal,
  Show,
  createEffect,
  onMount,
  lazy,
  Suspense,
} from "solid-js";
import { isServer } from "solid-js/web";
import { CheckmarkIcon, CopyIcon } from "~/components/Icons";

const Preview = lazy(() => import("~/components/Preview"));
const BlogStatus = lazy(() => import("~/components/BlogStatus"));

const LS_KEY = "bdsmlr-rss-v2-session";

function loadSession(): string {
  if (isServer) return "";
  return localStorage.getItem(LS_KEY) || "";
}

function saveSession(val: string) {
  if (isServer) return;
  if (val) {
    localStorage.setItem(LS_KEY, val);
  } else {
    localStorage.removeItem(LS_KEY);
  }
}

export default function Home() {
  const [username, setUsername] = createSignal("mstara");
  const [v2session, setV2session] = createSignal("");
  const [page, setPage] = createSignal(1);
  const [includeReblogs, setIncludeReblogs] = createSignal(false);
  const [hydrated, setHydrated] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [fetchParams, setFetchParams] = createSignal<{
    u: string;
    s: string;
    p: number;
    r: boolean;
  } | null>(null);

  onMount(() => {
    setV2session(loadSession());
    setHydrated(true);
  });

  createEffect(() => {
    if (!hydrated()) return;
    saveSession(v2session().trim());
  });

  function handlePreview(e: Event) {
    e.preventDefault();
    setFetchParams({ u: username().trim(), s: v2session().trim(), p: page(), r: includeReblogs() });
  }

  function feedUrl() {
    if (isServer) return;
    const u = username().trim();
    if (!u) return "";
    const qs = new URLSearchParams();
    const s = v2session().trim();
    if (s) qs.set("v2_session", s);
    if (page() !== 1) qs.set("page", String(page()));
    if (includeReblogs()) qs.set("include_reblogs", "1");
    const q = qs.toString();
    return `${window.location.origin}/rss/${u}${q ? "?" + q : ""}`;
  }

  function copyUrl() {
    const url = feedUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main>
      <Title>BDSMLR RSS</Title>
      <h1>BDSMLR RSS Generator</h1>
      <p>
        You may have noticed that images stopped showing up in your BDSMLR RSS
        Feed. BDSMLR recently changed how it delivers images, so older feeds
        contain image links that no longer work. Their RSS Feed was not properly
        updated to use the new image URLs, so your feed contained broken image
        links. This generator fetches fresh data from BDSMLR, so your feed
        always has valid, working image links.
      </p>
      <p>
        This app is specifically designed to import BDSMLR blogs into your
        imaglr account using their RSS Feed Importer.
      </p>

      <form onSubmit={handlePreview}>
        <label for="username">
          Blog username
          <Suspense>
            <BlogStatus username={username} v2session={v2session} />
          </Suspense>
        </label>
        <input
          id="username"
          type="text"
          placeholder="e.g. mstara"
          value={username()}
          onInput={(e) => setUsername(e.currentTarget.value)}
          required
        />

        <details>
          <summary>
            Authentication (optional)
            <Show when={v2session().trim()}>
              <span class="auth-check">&#x2713;</span>
            </Show>
          </summary>
          <p>
            Some blogs require authentication. Paste your{" "}
            <code>v2_session</code> cookie value below.
          </p>
          <p>
            To find it: open BDSMLR in your browser, open DevTools (F12), go to{" "}
            <strong>Application</strong> → <strong>Cookies</strong> → select{" "}
            <strong>bdsmlr.com</strong>, then copy the <code>v2_session</code>{" "}
            value.
          </p>
          <label for="v2session">v2_session cookie</label>
          <input
            id="v2session"
            type="text"
            placeholder="Paste cookie value here"
            value={v2session()}
            onInput={(e) => setV2session(e.currentTarget.value)}
          />
        </details>

        <label for="page">Page</label>
        <input
          id="page"
          type="number"
          min="1"
          value={page()}
          onInput={(e) => setPage(Number(e.currentTarget.value) || 1)}
        />

        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={includeReblogs()}
            onChange={(e) => setIncludeReblogs(e.currentTarget.checked)}
          />
          include reblogs
        </label>

        <label for="feedUrl">Feed URL</label>
        <div class="copy-row">
          <input
            id="feedUrl"
            type="text"
            readOnly
            value={feedUrl()}
            classList={{ copied: copied() }}
          />
          <button
            type="button"
            class="copy-btn"
            onClick={copyUrl}
            title="Copy to clipboard"
          >
            <Show when={!copied()} fallback={<CheckmarkIcon />}>
              <CopyIcon />
            </Show>
          </button>
        </div>

        <button type="submit">Preview</button>
      </form>

      <Suspense fallback={<p>Loading...</p>}>
        <Preview fetchParams={fetchParams} />
      </Suspense>
    </main>
  );
}
