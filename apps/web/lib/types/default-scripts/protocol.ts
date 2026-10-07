import type { Script } from "@/lib/types/script";
import { defaultScript } from "@/lib/utils/script";

const protocol: Script = {
  ...defaultScript(),
  id: "miden-protocol",
  name: "miden-protocol",
  type: "library",
  digest: "0x59f743fbcdb9da4295f6f26446780e87be2319e806de6e1272d55c0997c1ce9f",
};

export default protocol;
