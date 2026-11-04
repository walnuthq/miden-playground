import { packageTypeEnum } from "@/db/schema";
import type { PackageType } from "@/lib/types";

// The `[lib] kind` names Miden accepts for the package types the playground
// supports, mapped to their canonical names. They mirror `TargetType`'s
// `FromStr` in miden-mast-package (0.35): "tx-script" is an alias that
// cargo-miden's templates still write, but the canonical name, the one
// `TargetType` serializes to, is "transaction-script". It's also what web apps
// loaded before the playground used the canonical name send.
const aliases: Record<string, PackageType> = {
  lib: "library",
  account: "account-component",
  "tx-script": "transaction-script",
};

const packageTypes: readonly PackageType[] = packageTypeEnum.enumValues;

export const packageTypeNames = packageTypes.join(", ");

// The canonical package type of a `[lib] kind`, or undefined for one the
// playground doesn't support.
export const toPackageType = (kind: string | undefined) => {
  if (!kind) {
    return undefined;
  }
  const type = aliases[kind] ?? kind;
  return packageTypes.find((packageType) => packageType === type);
};
