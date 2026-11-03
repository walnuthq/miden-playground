// Drops `packages.rust`: a package's source is its `<name>/src/lib.rs` in
// `packages.files`, which every write path already kept in step with `rust`.
// Rows where the two differ (none expected) get `files` backfilled from `rust`
// first, in the same transaction.
//
// Run it after the API that no longer reads or writes `rust` is deployed: the
// previous one inserts it. Idempotent: once the column is gone it does nothing.
//
//   node scripts/migrate-drop-packages-rust.ts --dry-run   # counts only
//   node scripts/migrate-drop-packages-rust.ts
//
// DATABASE_URL: the shell, then .env.local, then .env, as for drizzle-kit.
import { existsSync } from "node:fs";
import pg from "pg";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set: it defaults to .env");
}
const dryRun = process.argv.includes("--dry-run");

// The packages whose stored source isn't their `rust`.
const DIFFERING = `
  FROM packages
  WHERE rust <> ''
    AND (files ->> (name || '/src/lib.rs')) IS DISTINCT FROM rust`;

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const {
    rows: [column],
  } = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = 'packages' AND column_name = 'rust'`,
  );
  if (!column) {
    console.info("packages.rust is already dropped.");
  } else {
    const {
      rows: [{ total, differing }],
    } = await client.query(
      `SELECT (SELECT count(*) FROM packages)::int AS total,
              (SELECT count(*) ${DIFFERING})::int AS differing`,
    );
    console.info(
      `${total} packages, ${differing} with a src/lib.rs that isn't their rust.`,
    );
    if (dryRun) {
      console.info("Dry run: nothing changed.");
    } else {
      await client.query("BEGIN");
      const { rowCount } = await client.query(
        `UPDATE packages
         SET files = files || jsonb_build_object(name || '/src/lib.rs', rust)
         WHERE id IN (SELECT id ${DIFFERING})`,
      );
      await client.query("ALTER TABLE packages DROP COLUMN rust");
      await client.query("COMMIT");
      console.info(`Backfilled ${rowCount} packages, dropped packages.rust.`);
    }
  }
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
