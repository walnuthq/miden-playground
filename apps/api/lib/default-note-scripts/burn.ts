import { type Package, defaultPackage } from "@/lib/types";

const rust = "";

const masm = "";

const burn: Package = {
  ...defaultPackage(),
  id: "burn",
  name: "burn",
  type: "note-script",
  rust,
  masm,
  digest: "0x35cb0300a3e4b5d85a466be6e5baa018e41c0abc9ad6251c18db28d4027f77b3",
};

export default burn;
