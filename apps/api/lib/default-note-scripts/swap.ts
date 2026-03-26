import { type Package, defaultPackage } from "@/lib/types";

const rust = "";

const masm = "";

const swap: Package = {
  ...defaultPackage(),
  id: "swap",
  name: "swap",
  type: "note-script",
  rust,
  masm,
  digest: "0x3b15974f8eb16578776320ccb7e482c373804e2543308060c92d4c9a623fc26f",
};

export default swap;
