import { type Package, defaultPackage } from "@/lib/types";

const p2id: Package = {
  ...defaultPackage(),
  id: "p2id",
  name: "p2id",
  type: "note-script",
  digest: "0xf08ea78d8d0570b219a40bfc5652c1de5adb2dfdc7ab034622dedae7837ac8ac",
};

export default p2id;
