// The storage of count-reader.masm, by hand: a MASM package carries no
// schema (decision 3 of spec/remove-rust.md). Its slot names must be the
// ones the template declares (`pnpm templates:check`).
import type { TemplateSchema } from "../lib/types.ts";

const schema: TemplateSchema = {
  storage: {
    slots: [
      {
        name: "count_reader::count",
        description: "The last count copied from a counter account.",
        type: "value",
        valueType: "felt",
      },
    ],
  },
};

export default schema;
