import { type Script, defaultScript } from "@/lib/types/script";

const base: Script = {
  ...defaultScript(),
  id: "base",
  name: "base",
  dependencies: [],
};

export default base;
