import { createClient } from "@libsql/client";
import { dirname, resolve } from "path";
import { existsSync, mkdirSync } from "fs";

export function getDbPath(): string {
  return process.env.DATABASE_PATH
    ? resolve(process.env.DATABASE_PATH)
    : resolve(process.cwd(), "drizzle", "data", "db.sqlite");
}

export function createDbClient() {
  const dbPath = getDbPath();
  const dbDir = dirname(dbPath);

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const client = createClient({
    url: `file:${dbPath}`,
  });

  return { client, dbPath };
}
