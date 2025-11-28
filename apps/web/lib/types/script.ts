import { type Account as WasmAccountType } from "@demox-labs/miden-sdk";
import { type MidenSdk } from "@/lib/types";

export const scriptTypes = {
  account: "Account Script",
  note: "Note Script",
  transaction: "Transaction Script",
} as const;

export type ScriptType = keyof typeof scriptTypes;

export type ScriptExampleItem = {
  name: string;
  type: ScriptType;
};

export const scriptExamples = {
  "counter-contract": { name: "Counter Contract", type: "account" },
  "p2id-note": { name: "P2ID Note", type: "note" },
  // "counter-note": { name: "Counter Note", type: "note" },
} as const;

export type ScriptExample = keyof typeof scriptExamples;

export const scriptStatuses = {
  draft: "Draft",
  compiled: "Compiled",
} as const;

export type ScriptStatus = keyof typeof scriptStatuses;

type StorageRead =
  | {
      type: "value";
      index: number;
    }
  | {
      type: "map";
      index: number;
      key: string[];
    };

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

export type Export = {
  name: string;
  digest: string;
  signature: Signature;
  readOnly: boolean;
  storageRead?: StorageRead;
};

export const defaultExport = (): Export => ({
  name: "",
  digest: "",
  signature: defaultSignature(),
  readOnly: false,
});

export type Dependency = {
  name: string;
  digest: string;
};

export type Script = {
  id: string;
  name: string;
  packageName: string;
  type: ScriptType;
  status: ScriptStatus;
  readOnly: boolean;
  rust: string;
  masm: string;
  error: string;
  root: string;
  packageBytes: number[];
  exports: Export[];
  dependencies: Dependency[];
  // inputs: MidenInput[];
  updatedAt: number;
};

export const defaultScript = (): Script => ({
  id: "",
  name: "",
  packageName: "",
  type: "account",
  status: "draft",
  readOnly: false,
  rust: "",
  masm: "",
  error: "",
  root: "",
  packageBytes: [],
  exports: [],
  dependencies: [],
  // inputs: [],
  updatedAt: 0,
});

export const getStorageRead = ({
  wasmAccount,
  storageRead,
  midenSdk: { Word },
}: {
  wasmAccount: WasmAccountType;
  storageRead: StorageRead;
  midenSdk: MidenSdk;
}) => {
  if (storageRead.type === "map" && storageRead.key) {
    return wasmAccount
      .storage()
      .getMapItem(
        storageRead.index,
        new Word(BigUint64Array.from(storageRead.key))
      );
  } else {
    return wasmAccount.storage().getItem(storageRead.index);
  }
};

const formatProcedureInputs = (inputs: MidenInput[]) => {
  const reversed = [...inputs].reverse();
  return reversed
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
};

export const invokeProcedureCustomTransactionScript = ({
  contractName,
  procedureExport,
  procedureInputs,
}: {
  contractName: string;
  procedureExport: Export;
  procedureInputs: MidenInput[];
}) => `use.external_contract::${contractName}
use.std::sys

begin
    ${formatProcedureInputs(procedureInputs)}
    call.${contractName}::${procedureExport.name}
    exec.sys::truncate_stack
end
`;
