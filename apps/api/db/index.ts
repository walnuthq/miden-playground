import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { getContext } from "hono/context-storage";
import { relations } from "@/db/relations";

export const createDb = (client: Client) => drizzle({ client, relations });

export type Db = ReturnType<typeof createDb>;

// A Worker can't share a connection between requests: the middleware in
// index.ts opens one per request (pooled by Hyperdrive) and this returns it.
export const getDb = () => getContext<{ Variables: { db: Db } }>().var.db;
