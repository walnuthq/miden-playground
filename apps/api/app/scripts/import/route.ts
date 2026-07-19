import { groupBy } from "lodash";
import { basename } from "node:path";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import {
  execFile,
  safeRm,
  parseMidenProjectToml,
  compilePackage,
  createPackage,
} from "@/lib/utils";
import type { CompiledPackage, PackageSource } from "@/lib/types";
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
    Object.values(packageSources).map(async ({ midenProjectToml, rust }) => {
      const {
        package: { name },
        dependencies,
        lib: { kind: type },
      } = parseMidenProjectToml(midenProjectToml);
      const packageId = await createPackage({
        name,
        type,
        rust,
      });
      return {
        package: { id: packageId, name, type, rust },
        dependencies: Object.keys(dependencies).reduce<
          Record<string, { path: string }>
        >((previousValue, currentValue) => {
          return ["miden-core", "miden-protocol"].includes(currentValue)
            ? previousValue
            : {
                ...previousValue,
                [currentValue]: dependencies[currentValue] as { path: string },
              };
        }, {}),
      };
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
              midenProjectToml: "",
            };
            const {
              package: { name: dependencyName },
            } = parseMidenProjectToml(packageSource.midenProjectToml);
            const dependencyPackage = packagesWithDependencies.find(
              ({ package: { name } }) => name === dependencyName,
            ) ?? {
              package: {
                id: "",
                name: "",
                type: "account-component",
                digest: "",
              },
            };
            return {
              id: dependencyPackage.package.id,
              name: dependencyPackage.package.name,
              type: dependencyPackage.package.type,
              digest: "",
            };
          },
        );
        return compilePackage({
          id: dbPackage.id,
          rust: dbPackage.rust,
          dependencies: dependenciesPackages.map(({ id }) => id),
        });
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
        rust:
          file.name === "lib.rs"
            ? content
                .replaceAll(
                  "let key = Word::new([felt!(0), felt!(0), felt!(0), felt!(1)]);",
                  "let key = Word::new([felt!(1), felt!(0), felt!(0), felt!(0)]);",
                )
                .replace("1_000_000;", "1_000_000_000;")
            : previousValue.rust,
      }),
      { midenProjectToml: "", rust: "" },
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
