// Build-time variables, inlined by `next build`: see .env.example.
// Keep in sync with .env.example, .env.production and the
// `miden-playground-web#build` env list in turbo.json.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // system
      readonly NODE_ENV: "development" | "production" | "test";
      // server
      readonly SIMPLE_ANALYTICS_HOSTNAME?: string;
      // public
      readonly NEXT_PUBLIC_API_URL?: string;
      readonly NEXT_PUBLIC_API_REGISTRY_URL?: string;
      readonly NEXT_PUBLIC_GUARDIAN_ENDPOINT_URL?: string;
      readonly NEXT_PUBLIC_PARA_API_KEY?: string;
      readonly NEXT_PUBLIC_PARA_ENVIRONMENT?:
        "BETA" | "PROD" | "SANDBOX" | "DEV";
      readonly NEXT_PUBLIC_MIDEN_FEE_AMOUNT?: string;
    }
  }
}

export {};
