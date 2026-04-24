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
  CargoToml,
  CompiledPackage,
} from "@/lib/types/script";
import { baseDependency, stdDependency } from "@/lib/types/script";

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
  baseDependency,
  stdDependency,
];

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
        case "AccountId":
        case "FaucetId": {
          const { prefix, suffix } = JSON.parse(arg.value ?? "") as {
            prefix: string;
            suffix: string;
          };
          return `push.${prefix}.${suffix}`;
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

export const parseCargoToml = (cargoToml: string) =>
  parse(cargoToml) as CargoToml;

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
    ["Cargo.toml", "lib.rs"].includes(name),
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
        .replace("/Cargo.toml", "")
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
        cargoToml:
          file.name === "Cargo.toml" ? content : previousValue.cargoToml,
        rust: file.name === "lib.rs" ? content : previousValue.rust,
      }),
      { cargoToml: "", rust: "" },
    );
    return { ...previousValue, [currentValue]: packageSource };
  }, {});
};
