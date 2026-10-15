// Filled from the Worker's vars and secrets (nodejs_compat), and from
// .dev.vars with `wrangler dev`.
export const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
export const API_COMPILE_URL =
  process.env.API_COMPILE_URL ?? "http://localhost:8080";
export const API_REGISTRY_URL =
  process.env.API_REGISTRY_URL ?? "http://localhost:8081";
