/// <reference types="vite/client" />

// Build-time variables, inlined by `vite build`: see .env.example.
// Keep in sync with .env.example, .env.production and the
// `miden-playground-web#build` env list in turbo.json.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_REGISTRY_URL?: string;
  readonly VITE_GUARDIAN_ENDPOINT_URL?: string;
  readonly VITE_PARA_API_KEY?: string;
  readonly VITE_PARA_ENVIRONMENT?: "BETA" | "PROD" | "SANDBOX" | "DEV";
  readonly VITE_MIDEN_FEE_AMOUNT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
