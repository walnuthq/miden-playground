import { packageTypeEnum } from "@/db/schema";
import type { PackageType } from "@/lib/types";

// The `[lib] kind` names Miden accepts for the package types the playground
// supports, mapped to their canonical names. They mirror `TargetType`'s
// `FromStr` in miden-mast-package (0.35): "tx-script" is an alias that
// cargo-miden's templates still write, but the canonical name, the one
// `TargetType` serializes to, is "transaction-script". "tx-script" is also
// what the playground stored before it used the canonical name (the legacy
// package_type value), so it's read through here too.
// TODO: once no deployed API writes "tx-script" (the release after the one
// that added "transaction-script"), convert the rows in a migration and drop
// the legacy value from packageTypeEnum.
const aliases: Record<string, PackageType> = {
  lib: "library",
  account: "account-component",
  "tx-script": "transaction-script",
};

const packageTypes: readonly PackageType[] = packageTypeEnum.enumValues.filter(
  (value): value is PackageType => value !== "tx-script",
);

export const packageTypeNames = packageTypes.join(", ");

// The canonical package type of a `[lib] kind` (or a stored type), or
// undefined for one the playground doesn't support.
export const toPackageType = (kind: string | undefined) => {
  if (!kind) {
    return undefined;
  }
  const type = aliases[kind] ?? kind;
  return packageTypes.find((packageType) => packageType === type);
};
