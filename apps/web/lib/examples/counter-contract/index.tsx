import state from "@/lib/examples/counter-contract/state";
import { exampleMeta } from "@/lib/examples/meta";
import type { Example } from "@/lib/types/example";

const counterContract: Example = {
  ...exampleMeta("counter-account"),
  state,
};

export default counterContract;
