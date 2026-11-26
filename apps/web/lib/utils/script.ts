import { parse } from "smol-toml";
import { EMPTY_WORD } from "@/lib/constants";
import type {
  CompiledPackage,
  Dependency,
  MidenInput,
  MidenProjectToml,
  Package,
  PackageSource,
  ProcedureExport,
  Script,
  Signature,
} from "@/lib/types/script";
import {
  formatProcedureExportPath,
  formatProcedureInputs,
} from "@/lib/utils/procedure-inputs";
import {
  findCargoOnlyDirectories,
  findPackages,
  manifestSourcePath,
} from "@/lib/utils/project-files";
import { scriptFilePaths } from "@/lib/utils/script-files";

// Moved to `procedure-inputs.ts`, which the unit tests can load: still
// exported here for the app's imports.
export {
  formatProcedureExportPath,
  formatProcedureInputs,
  procedureSignature,
} from "@/lib/utils/procedure-inputs";

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
  files: {},
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

// Whether a script is assembled in the browser from its `masm` rather than
// loaded from its package: the built-in scripts, which have no package. The
// API's scripts have a package once compiled, and an empty `masm`: their
// source is in `files`.
export const assembledFromMasm = ({
  masm,
  masp,
}: Pick<Script, "masm" | "masp">) => masp === "" && masm !== "";

// api-compile's answer when it has one. Otherwise, when it can't tell or the
// package predates it, the name: a `get…` procedure. A wrong guess only costs
// a local run whose changes are discarded: nothing is submitted.
export const isReadOnlyProcedure = ({
  path,
  readOnly,
}: Pick<ProcedureExport, "path" | "readOnly">) =>
  readOnly ?? formatProcedureExportPath(path).startsWith("get");

const hasMarker = ({ attributes }: ProcedureExport, marker: string) =>
  attributes.attrs.some(
    (attribute) => "Marker" in attribute && attribute.Marker === marker,
  );

// The export a note or transaction script runs from, whose digest is the
// compiled script's root (checked with `NoteScript.fromPackage`): the one
// marked `note_script` or `transaction_script`, else `run` (packages compiled
// before the markers were reported), else the first export (the built-ins,
// whose only export is the script). Undefined for a script with no exports.
export const entryPointExport = ({
  procedureExports,
}: Pick<Script, "procedureExports">) =>
  procedureExports.find(
    (procedureExport) =>
      hasMarker(procedureExport, "note_script") ||
      hasMarker(procedureExport, "transaction_script"),
  ) ??
  procedureExports.find(
    ({ path }) => formatProcedureExportPath(path) === "run",
  ) ??
  procedureExports[0];

// A script that calls one procedure with its inputs. A package's procedure
// is called by its MAST root. A component assembled from MASM (`contractName`)
// is linked as `external_contract::<name>` and its procedure called by name:
// the last segment of the export's path, which for a built-in is the path in
// the standards library its MASM re-exports from.
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
    call.${contractName ? `${contractName}::${procedureExport.path.split("::").at(-1)}` : procedureExport.digest}
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
        readOnly: isReadOnlyProcedure(manifestExport.Procedure),
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

// A picked folder's projects: the packages it can import, keyed by directory
// (the API resolves `path = "../<dir>"` dependencies against its last
// segment), and the directories it can't, with why.
export type PickedProjects = {
  packageSources: Record<string, PackageSource>;
  refused: { directory: string; reason: string }[];
};

export const RUST_PROJECT_REASON =
  "a Rust project: the Playground imports Miden Assembly projects only.";

// Only the manifests and the modules they name are read: the folder can list
// thousands of files from target/.
export const fileListToPackageSources = async (
  fileList: FileList,
): Promise<PickedProjects> => {
  const files = new Map(
    Array.from(fileList, (file) => [file.webkitRelativePath, file]),
  );
  const read = (path: string) => {
    const file = files.get(path);
    return file ? readFileAsText(file) : Promise.resolve("");
  };
  const paths = [...files.keys()];
  const packages = await Promise.all(
    findPackages(paths).map(async ({ directory, manifestPath, rust }) => {
      const midenProjectToml = await read(manifestPath);
      const sourcePath = manifestSourcePath(directory, midenProjectToml);
      if (sourcePath && files.has(sourcePath)) {
        return {
          directory,
          source: { midenProjectToml, masm: await read(sourcePath) },
        };
      }
      return {
        directory,
        reason: rust
          ? RUST_PROJECT_REASON
          : sourcePath
            ? `its [lib] path, ${sourcePath.slice(directory.length + 1)}, isn't in the folder.`
            : "its miden-project.toml has no [lib] path naming a .masm file.",
      };
    }),
  );
  return {
    packageSources: Object.fromEntries(
      packages.flatMap(({ directory, source }) =>
        source ? [[directory, source]] : [],
      ),
    ),
    refused: [
      ...packages.flatMap(({ directory, reason }) =>
        reason ? [{ directory, reason }] : [],
      ),
      // A Cargo workspace's root has no manifest of its own: only a folder
      // with no Miden manifest at all is told it's a Rust project.
      ...(packages.length === 0 ? findCargoOnlyDirectories(paths) : []).map(
        (directory) => ({ directory, reason: RUST_PROJECT_REASON }),
      ),
    ].sort((a, b) => a.directory.localeCompare(b.directory)),
  };
};

export const packageToScript = ({
  id,
  name,
  type,
  files,
  commitment,
  masp,
  manifest,
  parameters,
  schemas,
  createdAt,
  updatedAt,
}: Package): Script => ({
  id,
  name,
  type,
  status: "compiled",
  readOnly: true,
  // Its source and manifest, at the root of the verified upload.
  files: Object.fromEntries(
    scriptFilePaths({ name }).flatMap((path) =>
      files[path] === undefined ? [] : [[path, files[path]]],
    ),
  ),
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
      readOnly: isReadOnlyProcedure(procedureExport),
      // The registry keeps the names apart from the manifest.
      ...(parameters?.[procedureExport.path] && {
        parameters: parameters[procedureExport.path],
      }),
    })),
  dependencies: manifest.dependencies.map((dependency) => ({
    id: dependency.name,
    name: dependency.name,
    type: dependency.kind,
    commitment: dependency.digest,
  })),
  // The registry keeps the schemas apart from the manifest too. Without them
  // the script has no metadata, as one compiled before schemas existed.
  ...(schemas && { metadata: schemas }),
  createdAt: new Date(createdAt).getTime(),
  updatedAt: new Date(updatedAt).getTime(),
});
