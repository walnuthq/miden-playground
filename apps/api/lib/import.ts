import { groupBy, mapValues, omit } from "lodash";
import { readTarGz, type TarFile } from "@/lib/tar";
import { parseMidenProjectToml } from "@/lib/toml";
import type { CompiledPackage, PackageSource } from "@/lib/types";
import { compilePackage, createPackage } from "@/lib/utils";

export const importScriptsFromPackageSources = async (
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
        dependencies: omit(dependencies, [
          "miden-core",
          "miden-protocol",
        ]) as Record<string, { path: string }>,
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

const fileName = (path: string) => path.split("/").at(-1) ?? "";

const filesToPackageSources = (files: TarFile[]) => {
  const packagesSourcesFilesByPackage = groupBy(files, ({ path }) =>
    path.replace("/miden-project.toml", "").replace("/src/lib.rs", ""),
  );
  return mapValues(
    packagesSourcesFilesByPackage,
    (packagesSourcesFiles): PackageSource => {
      const content = (name: string) =>
        packagesSourcesFiles.findLast(({ path }) => fileName(path) === name)
          ?.content ?? "";
      return {
        midenProjectToml: content("miden-project.toml"),
        rust: content("lib.rs").replaceAll(
          "let key = Word::new([felt!(0), felt!(0), felt!(0), felt!(1)]);",
          "let key = Word::new([felt!(1), felt!(0), felt!(0), felt!(0)]);",
        ),
      };
    },
  );
};

export const importScriptsFromGithubRepo = async ({
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
  // Download only the requested commit, branch or tag, as an archive.
  const [owner, repo] = new URL(githubRepoUrl).pathname
    .replace(/\.git$/, "")
    .split("/")
    .filter(Boolean);
  const archiveUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${ref}`;
  console.info(`fetch ${archiveUrl}`);
  const response = await fetch(archiveUrl, { signal });
  if (!response.ok || !response.body) {
    throw new Error(
      `Error: Could not download ${githubRepoUrl} at ${ref} (${response.status}).`,
    );
  }
  // Archive paths start with a `<repo>-<ref>/` directory.
  const projectDirPrefix = projectDir
    ? `${projectDir.replace(/\/$/, "")}/`
    : "";
  const files = await readTarGz(response.body, (path) => {
    const repoPath = path.slice(path.indexOf("/") + 1);
    return (
      repoPath.startsWith(projectDirPrefix) &&
      ["miden-project.toml", "lib.rs"].includes(fileName(repoPath))
    );
  });
  const packageSources = filesToPackageSources(files);
  return importScriptsFromPackageSources(packageSources, signal);
};
