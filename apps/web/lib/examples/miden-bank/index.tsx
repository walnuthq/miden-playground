import { exampleMeta } from "@/lib/examples/meta";
import state from "@/lib/examples/miden-bank/state";
import type { Example } from "@/lib/types/example";

const midenBank: Example = {
  ...exampleMeta("bank-account"),
  state,
};

export default midenBank;
