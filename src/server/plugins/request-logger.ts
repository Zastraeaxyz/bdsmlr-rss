import { defineNitroPlugin } from "nitropack/runtime";
import { getResponseStatus } from "h3";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("request", (event) => {
    event.context.requestStart = Date.now();
    const url = new URL(event.path, "http://x");
    url.searchParams.delete("v2_session");
    const path = url.pathname + (url.search ? "?" + url.searchParams.toString() : "");
    console.log(`[http] --> ${event.method} ${path}`);
  });

  nitro.hooks.hook("afterResponse", (event) => {
    const duration = Date.now() - ((event.context.requestStart as number) || 0);
    const url = new URL(event.path, "http://x");
    url.searchParams.delete("v2_session");
    const path = url.pathname + (url.search ? "?" + url.searchParams.toString() : "");
    console.log(
      `[http] <-- ${event.method} ${path} ${getResponseStatus(event)} ${duration}ms`,
    );
  });
});
