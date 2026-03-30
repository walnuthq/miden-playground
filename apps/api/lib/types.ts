import {
  type packagesTable,
  type packageTypeEnum,
  type packageStatusEnum,
} from "@/db/schema";

export type ScriptExample =
  | "none"
  | "counter-account"
  | "p2id-note"
  | "counter-note";

export type CargoToml = {
  package: {
    name: string;
    version: string;
    edition: string;
    metadata: {
      miden: {
        "project-kind": PackageType;
        dependencies: Record<string, { path: string }>;
      };
      component: {
        package: string;
        target: {
          dependencies: Record<string, { path: string }>;
        };
      };
    };
  };
};

export type NewPackage = typeof packagesTable.$inferInsert;

export type Package = Omit<typeof packagesTable.$inferSelect, "exports"> & {
  exports: Export[];
};

export const defaultPackage = (): Package => ({
  id: "",
  name: "",
  type: "account",
  status: "compiled",
  readOnly: true,
  rust: "",
  masm: "",
  digest: "",
  masp: "",
  exports: [],
  dependencies: [],
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

export type PackageType = (typeof packageTypeEnum.enumValues)[number];

export type PackageStatus = (typeof packageStatusEnum.enumValues)[number];

export type ProcedureExport = {
  path: string;
  digest: string;
  signature: { abi: number; params: string[]; results: string[] };
  attributes: { attrs: string[] };
};

export const defaultProcedureExport = (): ProcedureExport => ({
  path: "",
  digest: "",
  signature: { abi: 0, params: [], results: [] },
  attributes: { attrs: [] },
});

export type Export = { Procedure: ProcedureExport };

export type Dependency = { id: string; name: string; digest: string };

export const defaultDependencies = (): Dependency[] => [
  {
    id: "base",
    name: "base",
    digest:
      "0x389cc47c54704ed5d03183bcdc0819010501a1cab9f07a421432fc5c2a2e77ef",
  },
  {
    id: "std",
    name: "std",
    digest:
      "0x2eaedee678906c235e33a89a64d16ea71b951a444463e9bcf8675ab1fe6210c0",
  },
];

export type DefaultDependency = "basic-wallet";

export type PackageDependency = {
  id: string;
  name: string;
  type: PackageType;
  // digest: string;
  rust: string;
  // dependencies: string[];
};

export type PackageSource = { cargoToml: string; rust: string };
