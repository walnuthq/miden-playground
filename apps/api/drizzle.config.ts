import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Variables already set take precedence over the file.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // The postgres service in docker-compose.yml by default.
    url:
      process.env.DATABASE_URL ??
      "postgres://miden-playground:miden_playground_dev_password@localhost:5432/miden-playground",
  },
});
