import { type Package, defaultPackage } from "@/lib/types";

const mint: Package = {
  ...defaultPackage(),
  id: "mint",
  name: "mint",
  type: "note",
  digest: "0xdc4dcae6fb3adfa8ecde42762d990c600a730b52afdde400aebf49ae2d7deee2",
};

export default mint;
