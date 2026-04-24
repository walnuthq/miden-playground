import { groupBy } from "lodash";
import { basename } from "node:path";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { execFile, safeRm } from "@/lib/utils";
import {
  newPackage,
  generateCargoToml,
  parseCargoToml,
  compilePackage,
  readPackage,
} from "@/lib/miden-compiler";
import type { CompiledPackage, PackageSource } from "@/lib/types";
import { updatePackage } from "@/db/packages";
import { PACKAGES_PATH } from "@/lib/constants";

type ImportScriptsRequestBody = {
  packageSources?: Record<string, PackageSource>;
  githubRepoUrl?: string;
  projectDir?: string;
};

type ImportScriptsResponse = {
  packages: CompiledPackage[];
};

const importScriptsFromPackageSources = async (
  packageSources: Record<string, PackageSource>,
): Promise<CompiledPackage[]> => {
  const packagesWithDependencies = await Promise.all(
    Object.values(packageSources).map(async ({ cargoToml, rust }) => {
      const {
        package: {
          name,
          metadata: {
            miden: { "project-kind": type, dependencies = {} },
          },
        },
      } = parseCargoToml(cargoToml);
      const dbPackage = await newPackage({
        name,
        type,
        rust,
      });
      return { package: dbPackage, dependencies };
    }),
  );
  return Promise.all(
    packagesWithDependencies.map(
      async ({ package: dbPackage, dependencies }) => {
        const dependenciesPackages = Object.keys(dependencies).map(
          (dependency) => {
            const { path: dependencyPath } = dependencies[dependency] ?? {
              path: "",
            };
            const dependencyDir = dependencyPath.split("/").at(-1);
            const packagePath =
              Object.keys(packageSources).find((packagePath) => {
                const packageDir = packagePath.split("/").at(-1);
                return packageDir === dependencyDir;
              }) ?? "";
            const packageSource = packageSources[packagePath] ?? {
              cargoToml: "",
            };
            const {
              package: { name: dependencyName },
            } = parseCargoToml(packageSource.cargoToml);
            const dependencyPackage = packagesWithDependencies.find(
              ({ package: { name } }) => name === dependencyName,
            ) ?? { package: { id: "", name: "", type: "account", digest: "" } };
            return {
              id: dependencyPackage.package.id,
              name: dependencyPackage.package.name,
              type: dependencyPackage.package.type,
              digest: "",
            };
          },
        );
        await generateCargoToml({
          packageDir: dbPackage.id,
          name: dbPackage.name,
          type: dbPackage.type,
          dependencies: dependenciesPackages,
        });
        const { stderr } = await compilePackage({
          packageDir: dbPackage.id,
          name: dbPackage.name,
        });
        if (stderr) {
          console.error(stderr);
          await updatePackage({
            id: dbPackage.id,
            status: "error",
            dependencies: dependenciesPackages.map(({ id }) => id),
            exports: [],
          });
          return {
            ...dbPackage,
            dependencies: dependenciesPackages,
            status: "error",
            error: stderr,
            masm: "",
            masp: "",
            digest: "",
            exports: [],
          };
        }
        const {
          masp,
          digest,
          exports,
          dependencies: compiledDependencies,
        } = await readPackage(dbPackage.id);
        await updatePackage({
          id: dbPackage.id,
          status: "compiled",
          masp,
          digest,
          exports,
          dependencies: dependenciesPackages.map(({ id }) => id),
        });
        return {
          ...dbPackage,
          dependencies: dependenciesPackages.map((dependencyPackage) => {
            const dependency = compiledDependencies.find(
              ({ id }) => id === dependencyPackage.id,
            );
            return {
              id: dependencyPackage.id,
              name: dependencyPackage.name,
              type: dependencyPackage.type,
              digest: dependency?.digest ?? "",
            };
          }),
          status: "compiled",
          error: "",
          masm: "",
          masp,
          digest,
          exports,
        };
      },
    ),
  );
};

type File = { name: string; webkitRelativePath: string };

type FileList = File[];

const readFileAsText = ({ webkitRelativePath }: File) =>
  readFile(webkitRelativePath, "utf-8");

const fileListToPackageSources = async (fileList: FileList) => {
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
        rust:
          file.name === "lib.rs"
            ? content
                .replaceAll(
                  "let key = Word::new([felt!(0), felt!(0), felt!(0), felt!(1)]);",
                  "let key = Word::new([felt!(1), felt!(0), felt!(0), felt!(0)]);",
                )
                .replace("1_000_000;", "1_000_000_000;")
                .replace(
                  "get_balance(&self, depositor: AccountId)",
                  "get_balance(&self, depositor: AccountId, deposit_faucet: AccountId)",
                )
                .replace(
                  "[depositor.prefix, depositor.suffix, felt!(0), felt!(0)]",
                  "[depositor.prefix, depositor.suffix, deposit_faucet.prefix, deposit_faucet.suffix]",
                )
            : previousValue.rust,
      }),
      { cargoToml: "", rust: "" },
    );
    return { ...previousValue, [currentValue]: packageSource };
  }, {});
};

const importScriptsFromGithubRepo = async ({
  githubRepoUrl,
  projectDir,
}: {
  githubRepoUrl: string;
  projectDir?: string;
}) => {
  const repoDir = randomUUID();
  console.info(`git clone ${githubRepoUrl} ${repoDir}`);
  await execFile("git", ["clone", githubRepoUrl, repoDir], {
    cwd: PACKAGES_PATH,
  });
  const projectDirPath = `${PACKAGES_PATH}/${repoDir}${projectDir ? `/${projectDir}` : ""}`;
  const filenames = await readdir(projectDirPath, {
    recursive: true,
  });
  const fileList = filenames.map((filename) => ({
    name: basename(filename),
    webkitRelativePath: `${projectDirPath}/${filename}`,
  }));
  const packageSources = await fileListToPackageSources(fileList);
  await safeRm(`${PACKAGES_PATH}/${repoDir}`, {
    recursive: true,
    force: true,
  });
  return importScriptsFromPackageSources(packageSources);
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { packageSources, githubRepoUrl, projectDir } =
      body as ImportScriptsRequestBody;
    if (packageSources) {
      const packages = await importScriptsFromPackageSources(packageSources);
      return NextResponse.json<ImportScriptsResponse>({ packages });
    }
    if (githubRepoUrl) {
      if (!githubRepoUrl.startsWith("https://github.com/0xMiden/")) {
        throw new Error("Error: Invalid GitHub repository URL.");
      }
      const packages = await importScriptsFromGithubRepo({
        githubRepoUrl,
        projectDir,
      });
      return NextResponse.json<ImportScriptsResponse>({ packages });
    }
    throw new Error("Error: Invalid request body.");
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
