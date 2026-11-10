import type { MidenProjectToml, PackageSource } from "@/lib/types";
import { packageTypeNames, toPackageType } from "./package-type.ts";
import { parseMidenProjectToml } from "./toml.ts";

const lastSegment = (path: string) => path.split("/").at(-1);

// Parses the packages' miden-project.toml and resolves their path dependencies
// to package names, then orders them so each package comes after the ones it
// depends on.
export const resolvePackageSources = (
  packageSources: Record<string, PackageSource>,
) => {
  const packages = Object.entries(packageSources).map(
    ([packagePath, { midenProjectToml, rust }]) => {
      const fail = (reason: string) => {
        throw new Error(`Error: ${packagePath}: ${reason}`);
      };
      let manifest: Partial<MidenProjectToml>;
      try {
        manifest = parseMidenProjectToml(midenProjectToml ?? "");
      } catch (error) {
        const { message } = error as { message: string };
        return fail(`invalid miden-project.toml: ${message}`);
      }
      const name = manifest.package?.name;
      const type = toPackageType(manifest.lib?.kind);
      if (!name) {
        return fail("miden-project.toml has no [package] name.");
      }
      if (!type) {
        return fail(
          `miden-project.toml has no valid [lib] kind (one of ${packageTypeNames}).`,
        );
      }
      if (!rust) {
        return fail("src/lib.rs is missing or empty.");
      }
      return {
        packagePath,
        name,
        type,
        rust,
        dependencies: manifest.dependencies ?? {},
      };
    },
  );
  for (const [index, { name, packagePath }] of packages.entries()) {
    const duplicate = packages.findIndex((other) => other.name === name);
    if (duplicate !== index) {
      throw new Error(
        `Error: ${packagePath} and ${packages[duplicate]?.packagePath} are both named ${name}.`,
      );
    }
  }
  const resolved = packages.map(
    ({ packagePath, name, type, rust, dependencies }) => ({
      name,
      type,
      rust,
      dependencies: Object.entries(dependencies)
        .filter(
          ([dependency]) =>
            dependency !== "miden-core" && dependency !== "miden-protocol",
        )
        .flatMap(([dependencyName, dependency]) => {
          if (typeof dependency === "string") {
            return [];
          }
          const dependencyDir = lastSegment(dependency.path);
          const dependencyPackage = packages.find(
            ({ packagePath }) => lastSegment(packagePath) === dependencyDir,
          );
          if (!dependencyPackage) {
            throw new Error(
              `Error: ${packagePath} depends on ${dependencyName} (path = "${dependency.path}"), which isn't in the imported folder: import the folder that holds both.`,
            );
          }
          return [dependencyPackage.name];
        }),
    }),
  );
  const ordered: typeof resolved = [];
  const visiting = new Set<string>();
  const visit = (resolvedPackage: (typeof resolved)[number]) => {
    if (visiting.has(resolvedPackage.name)) {
      return;
    }
    visiting.add(resolvedPackage.name);
    for (const dependency of resolvedPackage.dependencies) {
      const dependencyPackage = resolved.find(
        ({ name }) => name === dependency,
      );
      if (dependencyPackage) {
        visit(dependencyPackage);
      }
    }
    ordered.push(resolvedPackage);
  };
  for (const resolvedPackage of resolved) {
    visit(resolvedPackage);
  }
  return ordered;
};
