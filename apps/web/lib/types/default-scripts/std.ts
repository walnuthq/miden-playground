import { type Script, defaultScript } from "@/lib/types/script";

const std: Script = {
  ...defaultScript(),
  id: "std",
  name: "Standard Package",
  packageName: "std",
};

export default std;
