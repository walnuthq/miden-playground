import { type Script, defaultScript } from "@/lib/types/script";

const base: Script = {
  ...defaultScript(),
  id: "base",
  name: "base",
  type: "library",
  digest: "0x389cc47c54704ed5d03183bcdc0819010501a1cab9f07a421432fc5c2a2e77ef",
  dependencies: [],
};

export default base;
