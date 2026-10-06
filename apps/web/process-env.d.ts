declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // system
      readonly NODE_ENV: "development" | "production" | "test";
      // private
      readonly ENVIRONMENT: "dev" | "staging" | "production";
      // public
      readonly NEXT_PUBLIC_API_URL: string;
      readonly NEXT_PUBLIC_API_REGISTRY_URL: string;
      readonly NEXT_PUBLIC_GUARDIAN_ENDPOINT_URL: string;
      readonly NEXT_PUBLIC_PARA_API_KEY: string;
      readonly NEXT_PUBLIC_PARA_ENVIRONMENT?: "BETA" | "PROD" | "SANDBOX" | "DEV";
    }
  }
}

export {};
