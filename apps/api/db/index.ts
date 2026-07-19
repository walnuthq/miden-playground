import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "@/db/relations";
import { PROJECT_ROOT } from "@/lib/constants";

config({ path: `${PROJECT_ROOT}/.env.local` });

const db = drizzle(process.env.DATABASE_URL, {
  relations,
});

export default db;
