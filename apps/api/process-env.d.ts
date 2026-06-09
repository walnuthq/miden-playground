declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // system
      readonly NODE_ENV: "development" | "production" | "test";
      // private
      readonly WEB_URL: string;
      readonly API_COMPILE_URL: string;
      readonly API_REGISTRY_URL: string;
      readonly PACKAGES_PATH: string;
      readonly DATABASE_URL: string;
      // public
    }
  }
}

export {};
