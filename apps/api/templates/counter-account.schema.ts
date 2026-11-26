// The storage of counter-account.masm, by hand: a MASM package carries no
// schema (decision 3 of spec/remove-rust.md). Its slot names must be the
// ones the template declares (`pnpm templates:check`).
import type { TemplateSchema } from "../lib/types.ts";

const schema: TemplateSchema = {
  storage: {
    slots: [
      {
        name: "counter_account::count_map",
        description: "The count, under the key [1, 0, 0, 0].",
        type: "map",
        keyType: "word",
        valueType: "felt",
      },
    ],
  },
};

export default schema;
