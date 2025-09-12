declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // system
      readonly NODE_ENV: "development" | "production" | "test";
      // private
      readonly ENVIRONMENT: "dev" | "staging" | "production";
      // public
      readonly NEXT_PUBLIC_API_URL: string;
    }
  }
}

export {};
