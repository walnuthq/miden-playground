export const scriptTypes = {
  library: "Library",
  "account-component": "Account Component",
  "authentication-component": "Authentication Component",
  note: "Note Script",
  "tx-script": "Transaction Script",
} as const;

export type ScriptType = keyof typeof scriptTypes;

export type ScriptExampleItem = {
  name: string;
  type: ScriptType;
};

export const scriptExamples = {
  "counter-account": { name: "Counter Contract", type: "account-component" },
  "p2id-note": { name: "P2ID Note", type: "note" },
  "counter-note": { name: "Counter Note", type: "note" },
  "counter-script": { name: "Counter Note", type: "tx-script" },
} as const;

export type ScriptExample = keyof typeof scriptExamples;

export const scriptStatuses = {
  draft: "Draft",
  compiled: "Compiled",
  error: "Error",
} as const;

export type ScriptStatus = keyof typeof scriptStatuses;

export type MidenType = "Felt" | "Word" | "AccountId" | "FaucetId" | "Asset";

export type MidenInput = {
  name: string;
  type: MidenType;
  value: string;
};

export type Signature = {
  abi: number;
  params: MidenType[];
  results: MidenType[];
};

export type ProcedureExport = {
  path: string;
  digest: string;
  signature: Signature;
  attributes: { attrs: string[] };
  readOnly?: boolean;
};

export type Export = { Procedure: ProcedureExport };

export type Dependency = {
  id: string;
  name: string;
  type: ScriptType;
  digest: string;
};

export const coreDependency: Dependency = {
  id: "miden-core",
  name: "miden-core",
  type: "library",
  digest: "0xcd9686a94d49ca36e2cf3f23d31016805c1dd7648d6f2e3260778a38b48e8f4b",
};

export const protocolDependency: Dependency = {
  id: "miden-protocol",
  name: "miden-protocol",
  type: "library",
  digest: "0xd358bb70b44c28ee0c4bded0a109a9228c99a962bc7d2c3a5995f465e9102bfd",
};

export type PackageSource = { midenProjectToml: string; rust: string };

export type Script = {
  id: string;
  name: string;
  type: ScriptType;
  status: ScriptStatus;
  readOnly: boolean;
  rust: string;
  masm: string;
  error: string;
  digest: string;
  masp: string;
  exports: Export[];
  procedureExports: ProcedureExport[];
  dependencies: Dependency[];
  createdAt: number;
  updatedAt: number;
};

export type CompiledPackage = Pick<
  Script,
  | "id"
  | "name"
  | "type"
  | "status"
  | "masm"
  | "rust"
  | "digest"
  | "masp"
  | "exports"
  | "error"
  | "dependencies"
>;

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
  lib: { kind: ScriptType; namespace: string };
  dependencies: Record<string, string | { path: string }>;
};
