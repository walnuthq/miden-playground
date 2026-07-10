import { config } from "dotenv";

export const PROJECT_ROOT =
  process.env.NODE_ENV !== "production" ? "." : "../../../..";

config({ path: `${PROJECT_ROOT}/.env.local` });

export const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
export const API_COMPILE_URL =
  process.env.API_COMPILE_URL ?? "http://localhost:8080";
export const API_REGISTRY_URL =
  process.env.API_REGISTRY_URL ?? "http://localhost:8081";
export const PACKAGES_PATH = process.env.PACKAGES_PATH ?? "/tmp";
