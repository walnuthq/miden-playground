import type { Script } from "@/lib/types/script";
import { defaultScript } from "@/lib/utils/script";

const core: Script = {
  ...defaultScript(),
  id: "miden-core",
  name: "miden-core",
  type: "library",
  commitment:
    "0xdd25712ddf6939c3d5970b060c2c0f6dcb45d5bb15436739417820f5f0a82ec5",
};

export default core;
