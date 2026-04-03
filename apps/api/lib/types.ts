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

export type Dependency = {
  id: string;
  name: string;
  type: PackageType;
  digest: string;
};

export type PackageSource = { cargoToml: string; rust: string };

export type CompiledPackage = Pick<
  Package,
  | "id"
  | "name"
  | "type"
  | "status"
  | "rust"
  | "masm"
  | "digest"
  | "masp"
  | "exports"
> & {
  error: string;
  dependencies: Dependency[];
};
