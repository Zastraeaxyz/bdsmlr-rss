import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { resolve } from "path";
import { createDbClient } from "./connection";

const { client, dbPath } = createDbClient();

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
