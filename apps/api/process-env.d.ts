// Keep in sync with .env.example and the `api#build` env list in turbo.json.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // system
      readonly NODE_ENV: "development" | "production" | "test";
      readonly NEXT_PHASE?: string;
      // private
      readonly WEB_URL?: string;
      readonly API_COMPILE_URL?: string;
      readonly API_REGISTRY_URL?: string;
      readonly PACKAGES_PATH?: string;
      readonly DATABASE_URL: string;
    }
  }
}

export {};
