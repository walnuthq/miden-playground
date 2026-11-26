// The templates' hand-written schemas (templates/*.schema.ts), by the
// template they describe: what the API sets as `metadata` when it creates a
// package from a template. A template that's absent has none: the blank
// ones, basic-wallet, auth-no-auth, and the counter's note and script, which
// read no note storage. Relative imports only: `pnpm templates:check` reads
// it on plain node.
import countReader from "../templates/count-reader.schema.ts";
import counterAccount from "../templates/counter-account.schema.ts";
import p2idNote from "../templates/p2id-note.schema.ts";
import type {
  PackageMetadata,
  ScriptExample,
  TemplateSchema,
} from "./types.ts";

export const templateSchemas: Partial<Record<ScriptExample, TemplateSchema>> = {
  "counter-account": counterAccount,
  "count-reader": countReader,
  "p2id-note": p2idNote,
};

// The `metadata` a package created from `template` starts with: its schema,
// and for a note the template's name, which its stale rule needs. Null when
// the template has no schema.
export const templateMetadata = (
  template: ScriptExample,
): PackageMetadata | null => {
  const schema = templateSchemas[template];
  if (!schema) {
    return null;
  }
  return {
    ...(schema.storage && { storage: schema.storage }),
    ...(schema.noteStorage && { noteStorage: schema.noteStorage, template }),
  };
};
