import { type Script, defaultScript } from "@/lib/types/script";

const std: Script = {
  ...defaultScript(),
  id: "std",
  name: "std",
  dependencies: [],
};

export default std;
