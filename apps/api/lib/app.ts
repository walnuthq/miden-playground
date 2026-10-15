import { Hono } from "hono";
import type { Db } from "@/db";

export type AppEnv = { Bindings: Env; Variables: { db: Db } };

export const createApp = () => new Hono<AppEnv>();
