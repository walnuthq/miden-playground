import type { Script } from "@/lib/types/script";
import { defaultScript } from "@/lib/utils/script";

const core: Script = {
  ...defaultScript(),
  id: "miden-core",
  name: "miden-core",
  type: "library",
  digest: "0xcd9686a94d49ca36e2cf3f23d31016805c1dd7648d6f2e3260778a38b48e8f4b",
};

export default core;
