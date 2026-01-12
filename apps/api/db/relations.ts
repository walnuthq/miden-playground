import { defineRelations } from "drizzle-orm";
import * as schema from "@/db/schema";

export const relations = defineRelations(schema, (r) => ({
  packagesTable: {
    verifiedAccountComponent: r.one.verifiedAccountComponentTable({
      from: r.packagesTable.id,
      to: r.verifiedAccountComponentTable.packageId,
    }),
  },
  verifiedAccountComponentTable: {
    package: r.one.packagesTable({
      from: r.verifiedAccountComponentTable.packageId,
      to: r.packagesTable.id,
      optional: false,
    }),
  },
  verifiedNoteTable: {
    package: r.one.packagesTable({
      from: r.verifiedNoteTable.packageId,
      to: r.packagesTable.id,
      optional: false,
    }),
  },
  verifiedTransactionTable: {
    package: r.one.packagesTable({
      from: r.verifiedTransactionTable.packageId,
      to: r.packagesTable.id,
      optional: false,
    }),
  },
}));
