// The Worker's vars (nodejs_compat fills `process.env` with them): wrangler.jsonc
// declares the local and production values, and .env.local overrides them with
// `wrangler dev`.
export const WEB_URL = process.env.WEB_URL;
export const API_COMPILE_URL = process.env.API_COMPILE_URL;
export const API_REGISTRY_URL = process.env.API_REGISTRY_URL;
