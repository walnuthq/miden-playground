import { Client } from "pg";
import { createMiddleware } from "hono/factory";
import { createDb } from "@/db";
import type { AppEnv } from "@/lib/app";

// Opens a connection through Hyperdrive for the request (read with getDb) and
// closes it once the response is sent.
export const dbMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });
  await client.connect();
  c.set("db", createDb(client));
  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});
