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
  digest: "0xfc4cf15379e9101f20b90cbdcf9e5177607a03379c51df2eee96bcb239382ddf",
};

export default mint;
