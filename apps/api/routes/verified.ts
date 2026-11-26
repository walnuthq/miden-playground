import { dbMiddleware } from "@/db/middleware";
import { getDependenciesDeep, getPackage } from "@/db/packages";
import { createApp } from "@/lib/app";
import { badRequest, errorResponse, notFound } from "@/lib/errors";
import { buildFiles, ownFiles } from "@/lib/package-files";
import { rateLimit } from "@/lib/rate-limit";
import { MANIFEST_FILE, sourceFilePath } from "@/lib/source-file";
import { parseMidenProjectToml } from "@/lib/toml";
import type { MidenProjectToml, PackageSource } from "@/lib/types";
import { fetchApiRegistry, isAlreadyVerified } from "@/lib/upstream";
import { isValidUUIDv4 } from "@/lib/uuid";
import {
  isBoundedArray,
  isId,
  isPackageSource,
  isRustPackageSource,
  isStringArray,
  isValidNetwork,
  isValidPackageName,
  RUST_UNSUPPORTED,
} from "@/lib/validation";

type VerifyAccountComponentRequestBody = {
  accountId: string;
  packageSource?: PackageSource;
  packageIds?: string[];
};

type VerifyNoteRequestBody = {
  noteId: string;
  packageSource?: PackageSource;
  dependencies?: PackageSource[];
  packageId?: string;
};

type VerifyResponse = { verified: boolean };

// A `[lib] path` the source can be written at: relative, inside the
// package's directory, a `.masm` file.
const isModulePath = (modulePath: unknown): modulePath is string =>
  typeof modulePath === "string" &&
  modulePath.length <= 255 &&
  modulePath.endsWith(".masm") &&
  modulePath
    .split("/")
    .every(
      (segment) =>
        /^[A-Za-z0-9_.-]+$/.test(segment) &&
        segment !== "." &&
        segment !== "..",
    );

// A project sent for verification, as api-compile builds it: its manifest as
// sent, and its MASM source where the manifest's `[lib] path` points (the
// Playground's own file name when it names none).
const packageSourceFiles = (
  name: string,
  manifest: Partial<MidenProjectToml>,
  packageSource: PackageSource,
) => {
  const modulePath = manifest.lib?.path ?? sourceFilePath(name);
  if (!isModulePath(modulePath)) {
    throw badRequest("Error: Invalid [lib] path in miden-project.toml.");
  }
  return {
    [`${name}/${MANIFEST_FILE}`]: packageSource.midenProjectToml,
    [`${name}/${modulePath}`]: packageSource.masm,
  };
};

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

// The files of a project sent for verification, under its package name,
// which becomes a directory name.
const sourceFiles = (packageSource: PackageSource) => {
  let manifest: Partial<MidenProjectToml>;
  try {
    manifest = parseMidenProjectToml(packageSource.midenProjectToml);
  } catch {
    throw badRequest("Error: Invalid miden-project.toml.");
  }
  const name = manifest.package?.name;
  if (!isValidPackageName(name)) {
    throw badRequest("Error: Invalid miden-project.toml.");
  }
  return { name, files: packageSourceFiles(name, manifest, packageSource) };
};

// A body's project sources, checked: a Rust one is refused as such.
const checkPackageSource = (packageSource: unknown) => {
  if (isRustPackageSource(packageSource)) {
    throw badRequest(RUST_UNSUPPORTED);
  }
  if (!isPackageSource(packageSource)) {
    throw invalidBody();
  }
};

// Asks api-registry to verify a project against an account or a note.
// "Already verified" is its 409: the project matched before, so it counts.
const verifyWithRegistry = async (
  path: string,
  body: Record<string, unknown>,
  signal: AbortSignal,
) => {
  try {
    const { verified } = await fetchApiRegistry<VerifyResponse>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    return verified;
  } catch (error) {
    if (isAlreadyVerified(error)) {
      return true;
    }
    throw error;
  }
};

const verified = createApp()
  .use("/verified-account-components/*", dbMiddleware)
  .use("/verified-notes/*", dbMiddleware)
  .post("/verified-account-components/:network", rateLimit, async (c) => {
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
      if (packageSource !== undefined) {
        checkPackageSource(packageSource);
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
        const { name, files } = sourceFiles(packageSource);
        const verified = await verifyWithRegistry(
          `/v1/${network}/verified-accounts`,
          {
            accountId,
            files,
            entrypoint: name,
            source: "miden-playground",
          },
          c.req.raw.signal,
        );
        return c.json<VerifyResponse>({ verified });
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
          verifiedList.push(
            await verifyWithRegistry(
              `/v1/${network}/verified-accounts`,
              {
                accountId,
                files: await packageFilesWithDependencies(dbPackage),
                entrypoint: dbPackage.name,
              },
              c.req.raw.signal,
            ),
          );
        }
        const verified = verifiedList.every((v) => v);
        return c.json<VerifyResponse>({ verified });
      }
      throw invalidBody();
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .post("/verified-notes/:network", rateLimit, async (c) => {
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
      if (packageSource !== undefined) {
        checkPackageSource(packageSource);
      }
      if (dependencies !== undefined) {
        if (!isBoundedArray(dependencies)) {
          throw invalidBody();
        }
        dependencies.forEach(checkPackageSource);
      }
      if (packageId !== undefined && !isValidUUIDv4(packageId)) {
        throw invalidBody();
      }
      if (packageSource && dependencies) {
        const { name, files: ownSourceFiles } = sourceFiles(packageSource);
        const files: Record<string, string> = Object.assign(
          {},
          ...dependencies.map((dependency) => sourceFiles(dependency).files),
          ownSourceFiles,
        );
        const verified = await verifyWithRegistry(
          `/v1/${network}/verified-notes`,
          { noteId, files, entrypoint: name, source: "miden-playground" },
          c.req.raw.signal,
        );
        return c.json<VerifyResponse>({ verified });
      } else if (packageId) {
        const dbPackage = await getPackage(packageId);
        if (!dbPackage) {
          throw notFound(`Package with ID ${packageId} not found.`);
        }
        const verified = await verifyWithRegistry(
          `/v1/${network}/verified-notes`,
          {
            noteId,
            files: await packageFilesWithDependencies(dbPackage),
            entrypoint: dbPackage.name,
          },
          c.req.raw.signal,
        );
        return c.json<VerifyResponse>({ verified });
      }
      throw invalidBody();
    } catch (error) {
      return errorResponse(c, error);
    }
  });

export default verified;
