import { groupBy } from "lodash";
import { parse } from "smol-toml";
import { EMPTY_WORD } from "@/lib/constants";
import type {
  Signature,
  ProcedureExport,
  PackageSource,
  Dependency,
  Script,
  MidenInput,
  MidenProjectToml,
  CompiledPackage,
  MidenType,
  MidenRawType,
  Package,
  MidenTypeStruct,
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
    digest:
      "0x4d34c859654c20dc21dd6ceb792b215d1210a0e81d5d663694f265d4f1545cfe",
  },
  {
    id: "miden-precompiles",
    name: "miden-precompiles",
    type: "library",
    // version: "0.29.4",
    digest:
      "0xa75eb666b0b27bb9c4679e92956515be411ce4dc1de68af8dd291f35c4f31fbc",
  },
  {
    id: "miden-protocol",
    name: "miden-protocol",
    type: "library",
    // version: "0.16.0",
    digest:
      "0x2466538eb39da9963466cd42cb06a2dc096d09360625c79ab05d83c731ad3ba4",
  },
  {
    id: "miden-tx-kernel",
    name: "miden-tx-kernel",
    type: "kernel",
    // version: "0.16.0",
    digest:
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
  digest: "",
  masp: "",
  exports: [],
  procedureExports: [],
  dependencies: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const formatProcedureExportPath = (path: string) =>
  path.split("::").at(-1)?.replaceAll('"', "") ?? "";

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
  const packagesSourcesFilesByPackage = groupBy(
    packagesSourcesFilesWithContent,
    ({ file }) =>
      file.webkitRelativePath
        .replace("/miden-project.toml", "")
        .replace("/src/lib.rs", ""),
  );
  return Object.keys(packagesSourcesFilesByPackage).reduce<
    Record<string, PackageSource>
  >((previousValue, currentValue) => {
    const packagesSourcesFilesWithContent =
      packagesSourcesFilesByPackage[currentValue];
    if (!packagesSourcesFilesWithContent) {
      return previousValue;
    }
    const packageSource = packagesSourcesFilesWithContent.reduce<PackageSource>(
      (previousValue, { file, content }) => ({
        ...previousValue,
        midenProjectToml:
          file.name === "miden-project.toml"
            ? content
            : previousValue.midenProjectToml,
        rust: file.name === "lib.rs" ? content : previousValue.rust,
      }),
      { midenProjectToml: "", rust: "" },
    );
    return { ...previousValue, [currentValue]: packageSource };
  }, {});
};

export const midenRawTypeToMidenType = (
  midenRawType: MidenRawType,
): MidenType => midenTypes[midenRawType];

export const packageToScript = ({
  id,
  name,
  type,
  files,
  digest,
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
  digest,
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
    digest: dependency.digest,
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
