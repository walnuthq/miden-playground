export const PROJECT_ROOT =
  process.env.NODE_ENV !== "production" ? "." : "../../../..";

export const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
export const PACKAGES_PATH = process.env.PACKAGES_PATH ?? "/tmp";
