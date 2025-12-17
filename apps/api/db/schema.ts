import {
  pgEnum,
  text,
  timestamp,
  pgTable,
  varchar,
  uuid,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const packageTypeEnum = pgEnum("package_type", [
  "account",
  "note-script",
  "transaction-script",
  "authentication-component",
]);

export const packageStatusEnum = pgEnum("package_status", [
  "draft",
  "compiled",
  "error",
]);

export const packagesTable = pgTable("packages", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  type: packageTypeEnum().notNull().default("account"),
  status: packageStatusEnum().default("draft"),
  readOnly: boolean("read_only").notNull().default(false),
  rust: text().notNull().default(""),
  masm: text().notNull().default(""),
  digest: varchar({ length: 66 })
    .notNull()
    .default(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ),
  exports: jsonb().array().notNull().default([]),
  dependencies: uuid().array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verifiedAccountComponentTable = pgTable(
  "verified_account_components",
  {
    id: uuid().primaryKey().defaultRandom(),
    accountId: varchar("account_id", { length: 32 }).notNull(),
    packageId: uuid("package_id").notNull(),
  }
);

export const verifiedNoteTable = pgTable("verified_notes", {
  id: uuid().primaryKey().defaultRandom(),
  noteId: varchar("note_id", { length: 66 }).notNull(),
  packageId: uuid("package_id").notNull(),
});

export const verifiedTransactionTable = pgTable("verified_transactions", {
  id: uuid().primaryKey().defaultRandom(),
  transactionId: varchar("transaction_id", { length: 66 }).notNull(),
  packageId: uuid("package_id").notNull(),
});
