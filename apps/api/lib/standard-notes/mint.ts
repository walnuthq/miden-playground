import { type Package, defaultPackage } from "@/lib/types";

const rust = "";

const masm = "";

const mint: Package = {
  ...defaultPackage(),
  id: "mint",
  name: "mint",
  type: "note-script",
  rust,
  masm,
  digest: "0xef1864750cbdec29e885d0a79173d791669089dfae44c5f6ddce855b3aee17c5",
};

export default mint;
