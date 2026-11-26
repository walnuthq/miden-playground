// Deletes the packages built from Rust, once, at the Playground's switch to
// MASM (spec/remove-rust.md, decision 2): they can't be compiled any more.
// A package is Rust-built when its `files` hold a Rust source (`*.rs`) or a
// `Cargo.toml`. Forks are packages too, so a fork of a Rust script goes with
// it; project links live in their URLs and only name package ids, which then
// answer 404. A package that isn't Rust-built but lists a deleted one among
// its `dependencies` loses that entry.
//
// A dry run by default: it prints what it would delete and changes nothing.
// `--delete` deletes, in one transaction. Running it again finds nothing.
//
//   DATABASE_URL=postgres://… node scripts/delete-rust-packages.ts [--delete]
//
// DATABASE_URL must be set in the shell: no env file is read, so the target
// is always the one typed. The production run is the user's to do or order,
// never a side effect of a deploy.
import pg from "pg";

const RUST_FILES = `
  jsonb_typeof(files) = 'object'
  AND EXISTS (
    SELECT 1 FROM jsonb_object_keys(files) AS path
    WHERE path LIKE '%.rs' OR path = 'Cargo.toml' OR path LIKE '%/Cargo.toml'
  )`;

const RUST_IDS = `SELECT id::text FROM packages WHERE ${RUST_FILES}`;

const DEPENDENTS = `
  NOT (${RUST_FILES})
  AND dependencies && ARRAY(${RUST_IDS})::varchar(36)[]`;

const main = async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "Set DATABASE_URL in the shell: this script reads no env file.",
    );
    process.exit(1);
  }
  const remove = process.argv.includes("--delete");
  const { hostname, port, pathname } = new URL(url);
  console.info(
    `${remove ? "Deleting from" : "Dry run on"} ${hostname}:${port || 5432}${pathname}`,
  );
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const count = async (where: string) =>
      Number(
        (
          await client.query<{ count: string }>(
            `SELECT count(*) FROM packages WHERE ${where}`,
          )
        ).rows[0]?.count ?? 0,
      );
    const report = async () => {
      const byKind = await client.query<{
        type: string;
        status: string;
        count: string;
      }>(
        `SELECT type, status, count(*) FROM packages WHERE ${RUST_FILES}
         GROUP BY type, status ORDER BY type, status`,
      );
      const total = await count("true");
      const rust = await count(RUST_FILES);
      const dependents = await count(DEPENDENTS);
      console.info(`Packages: ${total}`);
      console.info(`Rust-built: ${rust}`);
      for (const { type, status, count } of byKind.rows) {
        console.info(`  ${type}, ${status}: ${count}`);
      }
      console.info(
        `Other packages depending on a Rust-built one: ${dependents}`,
      );
      console.info(`Left after the deletion: ${total - rust}`);
      return { rust, dependents };
    };
    const { rust, dependents } = await report();
    if (!remove) {
      console.info("Nothing changed. Run again with --delete to delete.");
      return;
    }
    if (rust === 0 && dependents === 0) {
      console.info("Nothing to delete.");
      return;
    }
    await client.query("BEGIN");
    try {
      const updated = await client.query(
        `UPDATE packages
         SET dependencies = ARRAY(
           SELECT dependency FROM unnest(dependencies) AS dependency
           WHERE dependency NOT IN (${RUST_IDS})
         )::varchar(36)[]
         WHERE ${DEPENDENTS}`,
      );
      const deleted = await client.query(
        `DELETE FROM packages WHERE ${RUST_FILES}`,
      );
      await client.query("COMMIT");
      console.info(
        `Deleted ${deleted.rowCount} packages; removed their ids from the dependencies of ${updated.rowCount}.`,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    await report();
  } finally {
    await client.end();
  }
};

await main();
