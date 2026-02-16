export const scriptTypes = {
  library: "Library",
  account: "Account Component",
  "note-script": "Note Script",
  "transaction-script": "Transaction Script",
  "authentication-component": "Authentication Component",
} as const;

export type ScriptType = keyof typeof scriptTypes;

export type ScriptExampleItem = {
  name: string;
  type: ScriptType;
};

export const scriptExamples = {
  "counter-contract": { name: "Counter Contract", type: "account" },
  "p2id-note": { name: "P2ID Note", type: "note-script" },
  "counter-note": { name: "Counter Note", type: "note-script" },
} as const;

export type ScriptExample = keyof typeof scriptExamples;

export const scriptStatuses = {
  draft: "Draft",
  compiled: "Compiled",
  error: "Error",
} as const;

export type ScriptStatus = keyof typeof scriptStatuses;

type MidenType = "Felt" | "Word" | "AccountId";

export type MidenInput = {
  name: string;
  type: MidenType;
  value: string;
};

type Signature = { abi: number; params: MidenType[]; results: MidenType[] };

export const defaultSignature = (): Signature => ({
  abi: 0,
  params: [],
  results: [],
});

export type ProcedureExport = {
  path: string;
  digest: string;
  signature: Signature;
  attributes: { attrs: string[] };
  readOnly?: boolean;
};

export type Export = { Procedure: ProcedureExport };

export const defaultProcedureExport = (): ProcedureExport => ({
  path: "",
  digest: "",
  signature: defaultSignature(),
  attributes: { attrs: [] },
});

export type Dependency = {
  id: string;
  name: string;
  digest: string;
};

export const baseDependency: Dependency = {
  id: "base",
  name: "base",
  digest: "0x389cc47c54704ed5d03183bcdc0819010501a1cab9f07a421432fc5c2a2e77ef",
};

export const stdDependency: Dependency = {
  id: "std",
  name: "std",
  digest: "0x2eaedee678906c235e33a89a64d16ea71b951a444463e9bcf8675ab1fe6210c0",
};

export const defaultDependencies = (): Dependency[] => [
  baseDependency,
  stdDependency,
];

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
  procedureExports: ProcedureExport[];
  dependencies: Dependency[];
  // inputs: MidenInput[];
  createdAt: number;
  updatedAt: number;
};

export const defaultScript = (): Script => ({
  id: "",
  name: "",
  type: "account",
  status: "draft",
  readOnly: false,
  rust: "",
  masm: "",
  error: "",
  digest: "",
  masp: "",
  procedureExports: [],
  dependencies: [],
  // inputs: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const formatProcedureInputs = (inputs: MidenInput[]) =>
  inputs
    .toReversed()
    .map((arg) => {
      switch (arg.type) {
        case "Felt":
        case "Word": {
          return `push.${arg.value}`;
        }
        case "AccountId": {
          const { prefix, suffix } = JSON.parse(arg.value ?? "") as {
            prefix: string;
            suffix: string;
          };
          return `push.${suffix}\npush.${prefix}`;
        }
        default: {
          return "";
        }
      }
    })
    .join("\n");

export const invokeProcedureCustomTransactionScript = ({
  contractName,
  procedureExport,
  procedureInputs,
}: {
  contractName?: string;
  procedureExport: ProcedureExport;
  procedureInputs: MidenInput[];
}) => `${contractName ? `use external_contract::${contractName}` : ""}
use miden::core::sys

begin
    ${formatProcedureInputs(procedureInputs)}
    call.${contractName ? `${contractName}::${procedureExport.path}` : procedureExport.digest}
    exec.sys::truncate_stack
end
`;
