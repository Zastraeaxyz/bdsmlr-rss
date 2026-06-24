import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";
import { dirname, resolve } from "path";
import { existsSync, mkdirSync } from "fs";

const dbPath = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : resolve(process.cwd(), "drizzle", "data", "db.sqlite");
const dbDir = dirname(dbPath);

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const client = createClient({
  url: `file:${dbPath}`,
});

const db = drizzle(client);

async function main() {
  const migrationsFolder = resolve(import.meta.dirname, "migrations");

  console.log("Running migrations...");
  console.log("DB path:", dbPath);

  await migrate(db, { migrationsFolder });

  const tablesResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  const tableNames = tablesResult.rows.map((r) => r[0] as string);
  console.log("Tables:", tableNames.join(", ") || "(none)");

  console.log("Migrations complete!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
