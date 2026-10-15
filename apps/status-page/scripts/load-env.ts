// Loads local overrides from .env.local (see .env.example) into `process.env`.
// Import it first: ES modules run their imports in order, so it runs before any
// module that reads the environment. Variables already set, like the
// workflow's `env`, take precedence.
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
