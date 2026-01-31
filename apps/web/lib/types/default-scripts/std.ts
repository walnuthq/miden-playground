import { type Script, defaultScript } from "@/lib/types/script";

const std: Script = {
  ...defaultScript(),
  id: "std",
  name: "std",
  type: "library",
  digest: "0x2eaedee678906c235e33a89a64d16ea71b951a444463e9bcf8675ab1fe6210c0",
  dependencies: [],
};

export default std;
