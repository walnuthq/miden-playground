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
  digest: "0x6301e61ebfb491dd1fb4396bd8a97ac1c3618ecff6bb22823ffdedbd20eed721",
};

export default swap;
