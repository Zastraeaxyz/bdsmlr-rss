import { drizzle } from "drizzle-orm/libsql";
import { createDbClient } from "./connection";
import * as schema from "./schema";

const { client, dbPath } = createDbClient();

export const db = drizzle(client, { schema });
export { client, dbPath };
