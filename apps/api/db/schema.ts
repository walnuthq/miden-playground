import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const packageTypeEnum = pgEnum("package_type", [
  "library",
  "account-component",
  "authentication-component",
  "note",
  // Miden's canonical name (`TargetType` in miden-mast-package), never the
  // "tx-script" alias (see lib/package-type.ts).
  "transaction-script",
]);

export const packageStatusEnum = pgEnum("package_status", [
  "draft",
  "compiled",
  "error",
]);

export const packagesTable = pgTable("packages", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull().default(""),
  type: packageTypeEnum().notNull().default("account-component"),
  status: packageStatusEnum().notNull().default("draft"),
  readOnly: boolean("read_only").notNull().default(false),
  files: jsonb().notNull().default({}),
  masm: text().notNull().default(""),
  commitment: varchar({ length: 66 })
    .notNull()
    .default(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ),
  masp: text().notNull().default(""),
  exports: jsonb().array().notNull().default([]),
  dependencies: varchar({ length: 36 }).array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
