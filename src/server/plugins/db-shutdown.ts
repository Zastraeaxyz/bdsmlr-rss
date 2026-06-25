import { defineNitroPlugin } from "nitropack/runtime";
import { client } from "~/db/sqlite";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("close", () => {
    client.close();
  });
});
