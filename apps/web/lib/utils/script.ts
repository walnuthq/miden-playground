import { parse } from "smol-toml";
import { EMPTY_WORD } from "@/lib/constants";
import type {
  CompiledPackage,
  Dependency,
  MidenInput,
  MidenProjectToml,
  MidenRawType,
  MidenType,
  MidenTypeStruct,
  Package,
  PackageSource,
  ProcedureExport,
  Script,
  Signature,
} from "@/lib/types/script";
import { midenTypes } from "@/lib/types/script";

export const defaultSignature = (): Signature => ({
  abi: 3,
  params: [],
  results: [],
});

export const defaultProcedureExport = (): ProcedureExport => ({
  path: "",
  digest: EMPTY_WORD,
  signature: defaultSignature(),
  attributes: { attrs: [] },
});

export const defaultDependencies = (): Dependency[] => [
  {
    id: "miden-core",
    name: "miden-core",
    type: "library",
    // version: "0.29.4",
    commitment:
      "0x4d34c859654c20dc21dd6ceb792b215d1210a0e81d5d663694f265d4f1545cfe",
  },
  {
    id: "miden-precompiles",
    name: "miden-precompiles",
    type: "library",
    // version: "0.29.4",
    commitment:
      "0xa75eb666b0b27bb9c4679e92956515be411ce4dc1de68af8dd291f35c4f31fbc",
  },
  {
    id: "miden-protocol",
    name: "miden-protocol",
    type: "library",
    // version: "0.16.0",
    commitment:
      "0x2466538eb39da9963466cd42cb06a2dc096d09360625c79ab05d83c731ad3ba4",
  },
  {
    id: "miden-tx-kernel",
    name: "miden-tx-kernel",
    type: "kernel",
    // version: "0.16.0",
    commitment:
      "0xf598b10b510e3c9343404306bd49c9aa385abcca88a90b71eb9a6b4224de7c22",
  },
];

export const defaultScript = (): Script => ({
  id: "",
  name: "",
  type: "account-component",
  status: "draft",
  readOnly: false,
  rust: "",
  masm: "",
  error: "",
  warnings: "",
  commitment: "",
  masp: "",
  exports: [],
  procedureExports: [],
  dependencies: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Whether a script is built from its MASM source rather than from its package:
// the built-in scripts and the mock API's (tutorials), which have no package.
// A compiled Rust script has both: its `masm` is the compiler's Miden Assembly,
// shown in the MASM tab, which calls library procedures without including them
// and doesn't reassemble into the package. Never branch on `masm` alone.
export const assembledFromMasm = ({
  masm,
  masp,
}: Pick<Script, "masm" | "masp">) => masp === "" && masm !== "";

// Rust packages export kebab-case names, displayed as their snake_case source names.
export const formatProcedureExportPath = (path: string) =>
  path.split("::").at(-1)?.replaceAll('"', "").replaceAll("-", "_") ?? "";

export const formatProcedureInputs = (inputs: MidenInput[]) =>
  inputs
    .toReversed()
    .map((arg) => {
      switch (arg.type) {
        case "Felt":
        case "Word": {
          return `push.${arg.value}`;
        }
        // case "FaucetId":
        case "AccountId": {
          const { prefix, suffix } = JSON.parse(arg.value ?? "") as {
            prefix: string;
            suffix: string;
          };
          // TODO calling convention differs between MASM and Rust
          return `push.${suffix}.${prefix}`;
        }
        case "Asset": {
          const { prefix, suffix, amount } = JSON.parse(arg.value ?? "") as {
            prefix: string;
            suffix: string;
            amount: string;
          };
          return `push.0.0.0.${amount}\npush.${prefix}.${suffix}.0.0\n`;
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

@transaction_script
pub proc main(args: word)
    ${formatProcedureInputs(procedureInputs)}
    call.${contractName ? `${contractName}::${procedureExport.path}` : procedureExport.digest}
    exec.sys::truncate_stack
end
`;

export const parseMidenProjectToml = (midenProjectToml: string) =>
  parse(midenProjectToml) as MidenProjectToml;

export const compiledPackageToScript = (
  compiledPackage: CompiledPackage,
): Script => ({
  ...defaultScript(),
  ...compiledPackage,
  procedureExports: compiledPackage.error
    ? []
    : compiledPackage.exports.map((manifestExport) => ({
        ...defaultProcedureExport(),
        ...manifestExport.Procedure,
        readOnly: formatProcedureExportPath(
          manifestExport.Procedure.path,
        ).startsWith("get"),
      })),
});

export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      resolve(typeof fileReader.result === "string" ? fileReader.result : "");
    });
    fileReader.readAsText(file);
  });

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      resolve(
        fileReader.result instanceof ArrayBuffer
          ? fileReader.result
          : new ArrayBuffer(),
      );
    });
    fileReader.readAsArrayBuffer(file);
  });

export const fileListToPackageSources = async (fileList: FileList) => {
  const files = Array.from(fileList);
  const packagesSourcesFiles = files.filter(({ name }) =>
    ["miden-project.toml", "lib.rs"].includes(name),
  );
  const packagesSourcesFilesWithContent = await Promise.all(
    packagesSourcesFiles.map(async (packageSourceFile) => ({
      file: packageSourceFile,
      content: await readFileAsText(packageSourceFile),
    })),
  );
  const packagesSourcesFilesByPackage = Object.groupBy(
    packagesSourcesFilesWithContent,
    ({ file }) =>
      file.webkitRelativePath
        .replace("/miden-project.toml", "")
        .replace("/src/lib.rs", ""),
  );
  return Object.fromEntries(
    Object.entries(packagesSourcesFilesByPackage).map(
      ([packageDir, packagesSourcesFilesWithContent = []]): [
        string,
        PackageSource,
      ] => {
        const content = (name: string) =>
          packagesSourcesFilesWithContent.findLast(
            ({ file }) => file.name === name,
          )?.content ?? "";
        return [
          packageDir,
          {
            midenProjectToml: content("miden-project.toml"),
            rust: content("lib.rs"),
          },
        ];
      },
    ),
  );
};

export const midenRawTypeToMidenType = (
  midenRawType: MidenRawType,
): MidenType => midenTypes[midenRawType];

export const packageToScript = ({
  id,
  name,
  type,
  files,
  commitment,
  masp,
  manifest,
  createdAt,
  updatedAt,
}: Package): Script => ({
  id,
  name,
  type,
  status: "compiled",
  readOnly: true,
  rust: files["src/lib.rs"] ?? "",
  masm: "",
  error: "",
  warnings: "",
  commitment,
  masp,
  exports: manifest.exports,
  procedureExports: manifest.exports
    .filter(
      ({ Procedure: procedureExport }) =>
        formatProcedureExportPath(procedureExport.path) !== "init",
    )
    .map(({ Procedure: procedureExport }) => ({
      ...procedureExport,
      readOnly: formatProcedureExportPath(procedureExport.path).startsWith(
        "get",
      ),
    })),
  dependencies: manifest.dependencies.map((dependency) => ({
    id: dependency.name,
    name: dependency.name,
    type: dependency.kind,
    commitment: dependency.digest,
  })),
  createdAt: new Date(createdAt).getTime(),
  updatedAt: new Date(updatedAt).getTime(),
});

export const formatProcedureExportParamType = (type: MidenTypeStruct) => {
  switch (type.Struct.name) {
    case "miden:base/core-types@1.0.0/felt": {
      return "felt: Felt";
    }
    case "miden:base/core-types@1.0.0/word": {
      return "word: Word";
    }
    case "miden:base/core-types@1.0.0/account-id": {
      return "account_id: AccountId";
    }
    case "miden:base/core-types@1.0.0/asset": {
      return "asset: Asset";
    }
  }
};

export const formatProcedureExportResultType = (type: MidenTypeStruct) => {
  switch (type.Struct.name) {
    case "miden:base/core-types@1.0.0/felt": {
      return "Felt";
    }
    case "miden:base/core-types@1.0.0/word": {
      return "Word";
    }
    case "miden:base/core-types@1.0.0/account-id": {
      return "AccountId";
    }
    case "miden:base/core-types@1.0.0/asset": {
      return "Asset";
    }
  }
};
