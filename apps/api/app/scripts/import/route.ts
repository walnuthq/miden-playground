import { groupBy } from "lodash";
import { basename } from "node:path";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { execFile, safeRm, compilePackage, createPackage } from "@/lib/utils";
import { parseMidenProjectToml } from "@/lib/toml";
import type { CompiledPackage, PackageSource } from "@/lib/types";
import { PACKAGES_PATH } from "@/lib/constants";
import { upstreamErrorResponse } from "@/lib/upstream";

type ImportScriptsRequestBody = {
  packageSources?: Record<string, PackageSource>;
  githubRepoUrl?: string;
  projectDir?: string;
  ref?: string;
};

type ImportScriptsResponse = {
  packages: CompiledPackage[];
};

const importScriptsFromPackageSources = async (
  packageSources: Record<string, PackageSource>,
  signal?: AbortSignal,
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
  const packagesToCompile = packagesWithDependencies.map(
    ({ package: dbPackage, dependencies }) => ({
      package: dbPackage,
      dependencies: Object.keys(dependencies).map((dependency) => {
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
        );
        return dependencyPackage?.package.id ?? "";
      }),
    }),
  );
  // api-compile builds one package at a time and answers 503 once its queue is
  // full, so compile the packages in turn rather than all at once, each one
  // after the packages it depends on.
  const compiledPackages: CompiledPackage[] = [];
  const compiledPackageIds = new Set<string>();
  const compile = async ({
    package: dbPackage,
    dependencies,
  }: (typeof packagesToCompile)[number]) => {
    if (compiledPackageIds.has(dbPackage.id)) {
      return;
    }
    compiledPackageIds.add(dbPackage.id);
    for (const dependency of dependencies) {
      const dependencyPackage = packagesToCompile.find(
        ({ package: { id } }) => id === dependency,
      );
      if (dependencyPackage) {
        await compile(dependencyPackage);
      }
    }
    compiledPackages.push(
      await compilePackage({
        id: dbPackage.id,
        rust: dbPackage.rust,
        dependencies,
        signal,
      }),
    );
  };
  for (const packageToCompile of packagesToCompile) {
    await compile(packageToCompile);
  }
  return compiledPackages;
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
  ref = "HEAD",
  signal,
}: {
  githubRepoUrl: string;
  projectDir?: string;
  ref?: string;
  signal?: AbortSignal;
}) => {
  const repoDir = `${PACKAGES_PATH}/${randomUUID()}`;
  try {
    // Fetch only the requested commit, branch or tag rather than the whole
    // history.
    console.info(`git fetch ${githubRepoUrl} ${ref}`);
    await execFile("git", ["init", "--quiet", repoDir]);
    await execFile(
      "git",
      ["fetch", "--quiet", "--depth", "1", githubRepoUrl, ref],
      { cwd: repoDir },
    );
    await execFile("git", ["checkout", "--quiet", "FETCH_HEAD"], {
      cwd: repoDir,
    });
    const projectDirPath = `${repoDir}${projectDir ? `/${projectDir}` : ""}`;
    const filenames = await readdir(projectDirPath, {
      recursive: true,
    });
    const fileList = filenames.map((filename) => ({
      name: basename(filename),
      webkitRelativePath: `${projectDirPath}/${filename}`,
    }));
    const packageSources = await fileListToPackageSources(fileList);
    return await importScriptsFromPackageSources(packageSources, signal);
  } finally {
    await safeRm(repoDir, { recursive: true, force: true });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { packageSources, githubRepoUrl, projectDir, ref } =
      body as ImportScriptsRequestBody;
    if (packageSources) {
      const packages = await importScriptsFromPackageSources(
        packageSources,
        request.signal,
      );
      return NextResponse.json<ImportScriptsResponse>({ packages });
    }
    if (githubRepoUrl) {
      if (!githubRepoUrl.startsWith("https://github.com/0xMiden/")) {
        throw new Error("Error: Invalid GitHub repository URL.");
      }
      if (ref !== undefined && !/^\w[\w./-]*$/.test(ref)) {
        throw new Error("Error: Invalid Git ref.");
      }
      const packages = await importScriptsFromGithubRepo({
        githubRepoUrl,
        projectDir,
        ref,
        signal: request.signal,
      });
      return NextResponse.json<ImportScriptsResponse>({ packages });
    }
    throw new Error("Error: Invalid request body.");
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return (
      upstreamErrorResponse(error) ?? new NextResponse(message, { status: 500 })
    );
  }
};
