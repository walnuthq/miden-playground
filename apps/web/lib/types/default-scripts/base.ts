import { type Script, defaultScript } from "@/lib/types/script";

const base: Script = {
  ...defaultScript(),
  id: "base",
  name: "Base Package",
  packageName: "base",
};

export default base;
