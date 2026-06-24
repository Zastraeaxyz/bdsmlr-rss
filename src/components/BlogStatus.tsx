import {
  createSignal,
  createEffect,
  createResource,
  onCleanup,
  Switch,
  Match,
} from "solid-js";
import { isServer } from "solid-js/web";

type Status = "checking" | "exists" | "private" | "not-found";

export default function BlogStatus(props: {
  username: () => string;
  v2session: () => string;
}) {
  const [debounced, setDebounced] = createSignal("");

  let timer: ReturnType<typeof setTimeout>;
  createEffect(() => {
    if (isServer) return;
    const val = props.username();
    clearTimeout(timer);
    timer = setTimeout(() => setDebounced(val.trim()), 500);
  });
  onCleanup(() => clearTimeout(timer));

  const [status] = createResource(
    () => [debounced(), props.v2session()] as const,
    async ([username, session]) => {
      if (!username) return null;
      const qs = new URLSearchParams({ username });
      if (session) qs.set("v2_session", session);
      const res = await fetch(`/api/blog-status?${qs}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.status as Status | null;
    },
  );

  return (
    <Switch>
      <Match when={status.loading && !status()}>
        <span class="blog-status checking" title="Checking...">
          …
        </span>
      </Match>
      <Match when={status() === "exists"}>
        <span class="blog-status exists" title="Blog found">
          &#x2713;
        </span>
      </Match>
      <Match when={status() === "private"}>
        <span
          class="blog-status private"
          title="This blog is private. Please set up authentication."
        >
          &#x26A0;
        </span>
      </Match>
      <Match when={status() === "not-found"}>
        <span class="blog-status not-found" title="Blog not found">
          &#x2717;
        </span>
      </Match>
    </Switch>
  );
}
