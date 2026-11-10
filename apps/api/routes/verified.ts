import { dbMiddleware } from "@/db/middleware";
import { getDependenciesDeep, getPackage } from "@/db/packages";
import { createApp } from "@/lib/app";
import { badRequest, errorResponse, notFound } from "@/lib/errors";
import { buildFiles, ownFiles } from "@/lib/package-files";
import { projectTemplateFiles } from "@/lib/templates";
import { generateCargoToml, parseMidenProjectToml } from "@/lib/toml";
import type { PackageSource } from "@/lib/types";
import { fetchApiRegistry } from "@/lib/upstream";
import { isValidUUIDv4 } from "@/lib/uuid";
import {
  isBoundedArray,
  isId,
  isPackageSource,
  isStringArray,
  isValidNetwork,
  isValidPackageName,
} from "@/lib/validation";

type VerifyAccountComponentRequestBody = {
  accountId: string;
  packageSource?: PackageSource;
  packageIds?: string[];
};

type VerifyAccountComponentResponse = { verified: boolean };

type VerifyNoteRequestBody = {
  noteId: string;
  packageSource?: PackageSource;
  dependencies?: PackageSource[];
  packageId?: string;
};

type VerifyNoteResponse = { verified: boolean };

const packageSourceFiles = (name: string, packageSource: PackageSource) => ({
  [`${name}/.cargo/config.toml`]: projectTemplateFiles[".cargo/config.toml"],
  [`${name}/src/lib.rs`]: packageSource.rust,
  [`${name}/build.rs`]: projectTemplateFiles["build.rs"],
  [`${name}/Cargo.toml`]: generateCargoToml({ name }),
  [`${name}/Cargo.lock`]: projectTemplateFiles["Cargo.lock"],
  [`${name}/miden-project.toml`]: packageSource.midenProjectToml,
  [`${name}/rust-toolchain.toml`]: projectTemplateFiles["rust-toolchain.toml"],
});

// The files api-compile needs to build a stored package: its own, plus its
// dependencies', which its miden-project.toml points to by path
// (`../<dependency>`). Without them the build fails, e.g. for a note calling
// an account component.
const packageFilesWithDependencies = async (
  dbPackage: NonNullable<Awaited<ReturnType<typeof getPackage>>>,
) => {
  const dependencies =
    dbPackage.dependencies.length > 0
      ? await getDependenciesDeep(dbPackage.dependencies)
      : [];
  return buildFiles(ownFiles(dbPackage.name, dbPackage.files), dependencies);
};

const invalidBody = () => badRequest("Error: Invalid request body.");

// The package name of a miden-project.toml, which becomes a directory name.
const packageSourceName = (packageSource: PackageSource) => {
  let name: unknown;
  try {
    name = parseMidenProjectToml(packageSource.midenProjectToml).package.name;
  } catch {
    throw badRequest("Error: Invalid miden-project.toml.");
  }
  if (!isValidPackageName(name)) {
    throw badRequest("Error: Invalid miden-project.toml.");
  }
  return name;
};

const verified = createApp()
  .use("/verified-account-components/*", dbMiddleware)
  .use("/verified-notes/*", dbMiddleware)
  .post("/verified-account-components/:network", async (c) => {
    try {
      const network = c.req.param("network");
      if (!isValidNetwork(network)) {
        throw badRequest("Error: Invalid network.");
      }
      const { accountId, packageSource, packageIds } = await c.req
        .json<VerifyAccountComponentRequestBody>()
        .catch(() => {
          throw invalidBody();
        });
      if (!isId(accountId)) {
        throw invalidBody();
      }
      if (packageSource !== undefined && !isPackageSource(packageSource)) {
        throw invalidBody();
      }
      if (
        packageIds !== undefined &&
        (!isBoundedArray(packageIds) ||
          !isStringArray(packageIds) ||
          !packageIds.every(isValidUUIDv4))
      ) {
        throw invalidBody();
      }
      if (packageSource) {
        const name = packageSourceName(packageSource);
        const { verified } =
          await fetchApiRegistry<VerifyAccountComponentResponse>(
            `/v1/${network}/verified-accounts`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accountId,
                files: packageSourceFiles(name, packageSource),
                entrypoint: name,
                source: "miden-playground",
              }),
              signal: c.req.raw.signal,
            },
          );
        return c.json<VerifyAccountComponentResponse>({ verified });
      } else if (packageIds) {
        const rawPackages = await Promise.all(
          packageIds.map((packageId) => getPackage(packageId)),
        );
        const packages = rawPackages.filter(
          (dbPackage) => dbPackage !== undefined,
        );
        // Each verification compiles on api-compile, which builds one package
        // at a time and answers 503 once its queue is full: verify them in turn.
        const verifiedList: boolean[] = [];
        for (const dbPackage of packages) {
          const { verified } =
            await fetchApiRegistry<VerifyAccountComponentResponse>(
              `/v1/${network}/verified-accounts`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  accountId,
                  files: await packageFilesWithDependencies(dbPackage),
                  entrypoint: dbPackage.name,
                }),
                signal: c.req.raw.signal,
              },
            );
          verifiedList.push(verified);
        }
        const verified = verifiedList.every((v) => v);
        return c.json<VerifyAccountComponentResponse>({ verified });
      }
      throw invalidBody();
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .post("/verified-notes/:network", async (c) => {
    try {
      const network = c.req.param("network");
      if (!isValidNetwork(network)) {
        throw badRequest("Error: Invalid network.");
      }
      const { noteId, packageSource, dependencies, packageId } = await c.req
        .json<VerifyNoteRequestBody>()
        .catch(() => {
          throw invalidBody();
        });
      if (!isId(noteId)) {
        throw invalidBody();
      }
      if (packageSource !== undefined && !isPackageSource(packageSource)) {
        throw invalidBody();
      }
      if (
        dependencies !== undefined &&
        (!isBoundedArray(dependencies) || !dependencies.every(isPackageSource))
      ) {
        throw invalidBody();
      }
      if (packageId !== undefined && !isValidUUIDv4(packageId)) {
        throw invalidBody();
      }
      if (packageSource && dependencies) {
        const name = packageSourceName(packageSource);
        const files: Record<string, string> = Object.assign(
          packageSourceFiles(name, packageSource),
          ...dependencies.map((dependency) => {
            const dependencyName = packageSourceName(dependency);
            return packageSourceFiles(dependencyName, dependency);
          }),
        );
        const { verified } = await fetchApiRegistry<VerifyNoteResponse>(
          `/v1/${network}/verified-notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              noteId,
              files,
              entrypoint: name,
              source: "miden-playground",
            }),
            signal: c.req.raw.signal,
          },
        );
        return c.json<VerifyNoteResponse>({ verified });
      } else if (packageId) {
        const dbPackage = await getPackage(packageId);
        if (!dbPackage) {
          throw notFound(`Package with ID ${packageId} not found.`);
        }
        const { verified } = await fetchApiRegistry<VerifyNoteResponse>(
          `/v1/${network}/verified-notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              noteId,
              files: await packageFilesWithDependencies(dbPackage),
              entrypoint: dbPackage.name,
            }),
            signal: c.req.raw.signal,
          },
        );
        return c.json<VerifyNoteResponse>({ verified });
      }
      throw invalidBody();
    } catch (error) {
      return errorResponse(c, error);
    }
  });

export default verified;
