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
  name: varchar({ length: 255 }).notNull().default(""),
  type: packageTypeEnum().notNull().default("account"),
  status: packageStatusEnum().notNull().default("draft"),
  readOnly: boolean("read_only").notNull().default(false),
  rust: text().notNull().default(""),
  masm: text().notNull().default(""),
  digest: varchar({ length: 66 })
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

export const verifiedAccountComponentTable = pgTable(
  "verified_account_components",
  {
    id: uuid().primaryKey().defaultRandom(),
    networkId: text("network_id").notNull().default("mtst"),
    identifier: text().notNull(),
    accountId: varchar("account_id", { length: 32 }).notNull(),
    packageId: uuid("package_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);

export const verifiedNoteTable = pgTable("verified_notes", {
  id: uuid().primaryKey().defaultRandom(),
  networkId: text("network_id").notNull().default("mtst"),
  noteId: varchar("note_id", { length: 66 }).notNull(),
  packageId: uuid("package_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifiedTransactionTable = pgTable("verified_transactions", {
  id: uuid().primaryKey().defaultRandom(),
  networkId: text("network_id").notNull().default("mtst"),
  transactionId: varchar("transaction_id", { length: 66 }).notNull(),
  packageId: uuid("package_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
