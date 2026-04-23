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
  digest: "0xdad2020d27b388008dedb2dfa1952a1be7d45c9f8b8366ca734de06a07247f9e",
};

export default burn;
