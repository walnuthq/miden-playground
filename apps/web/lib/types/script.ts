import { type Account as WasmAccount } from "@demox-labs/miden-sdk";

export const scriptTypes = {
  account: "Account Script",
  note: "Note Script",
  // transaction: "Transaction Script",
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

export const midenTypes = {
  void: "void",
  felt: "Felt",
  word: "Word",
  account_id: "AccountId",
} as const;

type MidenType = keyof typeof midenTypes;

type MidenInput = {
  name: string;
  type: MidenType;
  value?: string;
};

type StorageRead =
  | {
      type: "value";
      index: number;
    }
  | {
      type: "map";
      index: number;
      key: bigint[];
    };

export type Procedure = {
  name: string;
  inputs: MidenInput[];
  returnType: MidenType;
  readOnly: boolean;
  storageRead?: StorageRead;
  foreignAccounts?: string[];
};

export type Script = {
  id: string;
  name: string;
  packageName: string;
  type: ScriptType;
  status: ScriptStatus;
  rust: string;
  masm: string;
  error: string;
  root: string;
  dependencies: string[];
  procedures: Procedure[];
  inputs: MidenInput[];
  updatedAt: number;
};

export const defaultScript = (): Script => ({
  id: "",
  name: "",
  packageName: "",
  type: "account",
  status: "draft",
  rust: "",
  masm: "",
  error: "",
  root: "",
  dependencies: [],
  procedures: [],
  inputs: [],
  updatedAt: 0,
});

export const getStorageRead = async (
  wasmAccount: WasmAccount,
  storageRead: StorageRead
) => {
  if (storageRead.type === "map" && storageRead.key) {
    const { Word: WasmWord } = await import("@demox-labs/miden-sdk");
    return wasmAccount
      .storage()
      .getMapItem(
        storageRead.index,
        new WasmWord(BigUint64Array.from(storageRead.key))
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
        case "felt":
        case "word": {
          return `push.${arg.value}`;
        }
        case "account_id": {
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

export const invokeProcedureCustomTransactionScript = (
  contractName: string,
  procedure: Procedure
) => `use.external_contract::${contractName}
use.std::sys

begin
    ${formatProcedureInputs(procedure.inputs)}
    call.${contractName}::${procedure.name}
    exec.sys::truncate_stack
end
`;
