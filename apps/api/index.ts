import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { createApp } from "@/lib/app";
import { WEB_URL } from "@/lib/constants";
import root from "@/routes/root";
import scripts from "@/routes/scripts";
import verified from "@/routes/verified";

const allowedOrigins = [
  WEB_URL,
  // The web Worker's own domain; WEB_URL is the one Vercel proxies to it.
  "https://miden-playground.walnut.dev",
  // The web Worker's `qa` preview alias (`wrangler versions upload
  // --preview-alias qa`), for QA before a deploy.
  "https://qa-miden-playground.walnuthq.workers.dev",
  "https://testnet.midenscan.com",
  "https://devnet.midenscan.com",
  "https://explorer.devnet.miden.io",
  "https://explorer.testnet.miden.io",
];

const app = createApp()
  .use(contextStorage())
  .use(
    cors({
      origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .route("/", root)
  .route("/scripts", scripts)
  .route("/", verified);

export default app;
