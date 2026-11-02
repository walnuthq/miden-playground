// Loads local overrides from .env.local (see .env.example) into `process.env`.
// Import it first: ES modules run their imports in order, so it runs before any
// module that reads the environment. Variables already set, like the
// workflow's `env`, take precedence. The file is optional (CI has none), and
// process.loadEnvFile throws when it's missing.
import { existsSync } from "node:fs";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
