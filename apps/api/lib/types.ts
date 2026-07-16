import type {
  packagesTable,
  packageTypeEnum,
  packageStatusEnum,
} from "@/db/schema";

export type ScriptExample =
  "none" | "p2id-note" | "counter-account" | "counter-note" | "counter-script";

export type MidenProjectToml = {
  package: {
    name: string;
    version: string;
    metadata: {
      miden: {
        "supported-types": string[];
        dependencies: Record<string, { path: string }>;
      };
    };
  };
  lib: { kind: PackageType; namespace: string };
  dependencies: Record<string, string | { path: string }>;
};

export type NewPackage = typeof packagesTable.$inferInsert;

export type Package = Omit<
  typeof packagesTable.$inferSelect,
  "files" | "exports"
> & {
  files: Record<string, string>;
  exports: Export[];
};

export const defaultPackage = (): Package => ({
  id: "",
  name: "",
  type: "account-component",
  status: "compiled",
  readOnly: true,
  rust: "",
  files: {},
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

type ProcedureSignature = { abi: number; params: string[]; results: string[] };

export type ProcedureExport = {
  path: string;
  digest: string;
  signature: ProcedureSignature | null;
  attributes: { attrs: string[] };
};

export const defaultProcedureExport = (): ProcedureExport => ({
  path: "",
  digest: "",
  signature: { abi: 0, params: [], results: [] },
  attributes: { attrs: [] },
});

export type Export = { Procedure: ProcedureExport };

export type PackageDependency = {
  name: string;
  kind: string;
  version: string;
  digest: string;
};

export type Dependency = {
  id: string;
  name: string;
  type: PackageType;
  digest: string;
};

export type PackageSource = { midenProjectToml: string; rust: string };

export type CompiledPackage = Pick<
  Package,
  | "id"
  | "name"
  | "type"
  | "status"
  | "masm"
  | "rust"
  | "digest"
  | "masp"
  | "exports"
> & {
  error: string;
  dependencies: Dependency[];
};

export type Manifest = { exports: Export[]; dependencies: PackageDependency[] };
