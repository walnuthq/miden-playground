import type { Script } from "@/lib/types/script";
import { defaultScript } from "@/lib/utils/script";

const protocol: Script = {
  ...defaultScript(),
  id: "miden-protocol",
  name: "miden-protocol",
  type: "library",
  digest: "0xd358bb70b44c28ee0c4bded0a109a9228c99a962bc7d2c3a5995f465e9102bfd",
};

export default protocol;
