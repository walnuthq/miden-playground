declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // system
      readonly NODE_ENV: "development" | "production" | "test";
      // private
      readonly WEB_URL: string;
      readonly PACKAGES_PATH: string;
      // public
    }
  }
}

export {};
