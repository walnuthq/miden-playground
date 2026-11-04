import { dbMiddleware } from "@/db/middleware";
import { getDependencies, getPackage } from "@/db/packages";
import { createApp } from "@/lib/app";
import { projectTemplateFiles } from "@/lib/templates";
import { generateCargoToml, parseMidenProjectToml } from "@/lib/toml";
import type { PackageSource } from "@/lib/types";
import { fetchApiRegistry, upstreamErrorResponse } from "@/lib/upstream";

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
      ? await getDependencies(dbPackage.dependencies)
      : [];
  return Object.assign(
    {},
    dbPackage.files,
    ...dependencies.map(({ files }) => files),
  ) as Record<string, string>;
};

const verified = createApp()
  .use("/verified-account-components/*", dbMiddleware)
  .use("/verified-notes/*", dbMiddleware)
  .post("/verified-account-components/:network", async (c) => {
    try {
      const network = c.req.param("network");
      const { accountId, packageSource, packageIds } =
        await c.req.json<VerifyAccountComponentRequestBody>();
      if (packageSource) {
        const {
          package: { name },
        } = parseMidenProjectToml(packageSource.midenProjectToml);
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
      throw new Error("Error: Invalid request body.");
    } catch (error) {
      console.error(error);
      const { message } = error as { message: string };
      return upstreamErrorResponse(error) ?? c.text(message, 500);
    }
  })
  .post("/verified-notes/:network", async (c) => {
    try {
      const network = c.req.param("network");
      const { noteId, packageSource, dependencies, packageId } =
        await c.req.json<VerifyNoteRequestBody>();
      if (packageSource && dependencies) {
        const {
          package: { name },
        } = parseMidenProjectToml(packageSource.midenProjectToml);
        const files: Record<string, string> = Object.assign(
          packageSourceFiles(name, packageSource),
          ...dependencies.map((dependency) => {
            const {
              package: { name: dependencyName },
            } = parseMidenProjectToml(dependency.midenProjectToml);
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
          throw new Error(`Package with ID ${packageId} not found.`);
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
      throw new Error("Error: Invalid request body.");
    } catch (error) {
      console.error(error);
      const { message } = error as { message: string };
      return upstreamErrorResponse(error) ?? c.text(message, 500);
    }
  });

export default verified;
