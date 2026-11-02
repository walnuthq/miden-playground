import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Same files and precedence as `wrangler dev`: the shell, then .env.local, then
// .env. loadEnvFile never overwrites a variable that's already set, so the
// files load from most to least specific.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set: it defaults to .env");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url },
});
