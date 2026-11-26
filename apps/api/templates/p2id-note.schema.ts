// The storage of p2id-note.masm (the note's inputs), by hand: a MASM package
// carries no schema (decision 3 of spec/remove-rust.md). The fields are in
// the order of their felts in the note's storage, which is the order the
// script reads them in: the target account's id, its prefix then its suffix
// (an `account-id` field's layout in the web app's note form).
import type { TemplateSchema } from "../lib/types.ts";

const schema: TemplateSchema = {
  noteStorage: {
    name: "p2id-note",
    fields: [
      {
        name: "target-account-id",
        type: "account-id",
        width: 2,
        description:
          "The account the note pays, the only one that can consume it.",
      },
    ],
  },
};

export default schema;
