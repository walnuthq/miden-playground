import { strToU8, zipSync } from "fflate";
import type { Context } from "hono";
import { dbMiddleware } from "@/db/middleware";
import {
  claimPackage,
  deletePackage,
  getDependencies,
  getDependenciesDeep,
  getPackage,
  getPackageTree,
  insertPackages,
} from "@/db/packages";
import { type AppEnv, createApp } from "@/lib/app";
import {
  basicWalletDependency,
  counterAccountDependency,
  defaultDependenciesRecords,
} from "@/lib/default-dependencies";
import { badRequest, errorResponse, forbidden, notFound } from "@/lib/errors";
import { forkPackages } from "@/lib/fork";
import { importExample, importScriptsFromPackageSources } from "@/lib/import";
import {
  hashOwnerToken,
  isWritable,
  ownerToken,
  writeAccess,
} from "@/lib/owner";
import { exportFiles } from "@/lib/package-files";
import { toPackageType } from "@/lib/package-type";
import { rateLimit } from "@/lib/rate-limit";
import { templates } from "@/lib/templates";
import type {
  CompiledPackage,
  Dependency,
  Export,
  Package,
  PackageSource,
  ProcedureExport,
  ScriptExample,
  ScriptFiles,
} from "@/lib/types";
import { compilePackage, createPackage, scriptFiles } from "@/lib/utils";
import { isValidUUIDv4 } from "@/lib/uuid";
import {
  isBoundedArray,
  isPackageSources,
  isSource,
  isStringArray,
  isValidPackageName,
  MAX_PACKAGES,
} from "@/lib/validation";

type CreateScriptRequestBody = {
  name: string;
  type: string;
  example: ScriptExample;
};

type CreateScriptResponse = {
  package: Pick<Package, "id" | "name" | "type"> & {
    dependencies: Dependency[];
    files: ScriptFiles;
  };
};

const scriptsDependencies: Record<ScriptExample, Dependency[]> = {
  none: [],
  "p2id-note": [basicWalletDependency],
  "auth-no-auth": [],
  "counter-account": [],
  "counter-note": [],
  "counter-script": [],
  "count-reader": [counterAccountDependency],
} as const;

type GetScriptResponse = {
  package: Omit<
    Package,
    "files" | "dependencies" | "ownerKeyHash" | "createdAt" | "updatedAt"
  > & {
    files: ScriptFiles;
    dependencies: Dependency[];
    // Whether the caller's owner token could change the package: false for
    // another owner's, which the web app then shows read-only.
    writable: boolean;
    procedureExports: ProcedureExport[];
    createdAt: number;
    updatedAt: number;
  };
};

type CompileScriptRequestBody = {
  // The edited files: `src/lib.rs` only, the manifests are generated.
  files?: ScriptFiles;
  dependencies: string[];
};

type CompileScriptResponse = { package: CompiledPackage };

type ImportScriptsRequestBody = {
  packageSources: Record<string, PackageSource>;
};

type ImportScriptsResponse = {
  packages: CompiledPackage[];
};

// The copies a fork made: `package` is the forked one's, `packages` holds it
// and its dependencies'.
type ForkScriptResponse = {
  package: { id: string };
  packages: CompiledPackage[];
};

// The hash of the caller's owner token (lib/owner.ts): undefined for a
// request without one.
const callerKeyHash = async (c: Context<AppEnv>) => {
  const token = ownerToken(c.req.header("Authorization"));
  if (token === null) {
    throw badRequest("Error: Invalid owner token.");
  }
  return token === undefined ? undefined : hashOwnerToken(token);
};

// Refuses a write to another owner's package. A package without an owner
// becomes the caller's.
const authorizeWrite = async (
  { id, ownerKeyHash }: { id: string; ownerKeyHash: string | null },
  tokenHash: string | undefined,
) => {
  const notOwner = () =>
    forbidden(
      "Error: This script belongs to someone else. Fork it to get a copy you can change.",
    );
  const access = writeAccess({ ownerKeyHash, tokenHash });
  if (access === "deny") {
    throw notOwner();
  }
  if (
    access === "claim" &&
    tokenHash !== undefined &&
    !(await claimPackage(id, tokenHash))
  ) {
    // Someone claimed it since it was read.
    const current = await getPackage(id);
    if (!current) {
      throw notFound("Error: Package not found.");
    }
    if (
      writeAccess({ ownerKeyHash: current.ownerKeyHash, tokenHash }) !== "allow"
    ) {
      throw notOwner();
    }
  }
};

const packageId = (id: string) => {
  if (!isValidUUIDv4(id)) {
    throw notFound("Error: Package not found.");
  }
  return id;
};

const invalidBody = () => badRequest("Error: Invalid request body.");

const scripts = createApp()
  .use(dbMiddleware)
  .post("/", rateLimit, async (c) => {
    try {
      const { name, type, example } = await c.req
        .json<CreateScriptRequestBody>()
        .catch(() => {
          throw invalidBody();
        });
      // A web app loaded before the rename can still send "tx-script".
      const packageType = toPackageType(type);
      if (!packageType) {
        return c.text(`Error: Invalid script type ${type}.`, 400);
      }
      if (!isValidPackageName(name)) {
        throw badRequest("Error: Invalid script name.");
      }
      if (!Object.hasOwn(scriptsDependencies, example)) {
        throw badRequest("Error: Invalid script example.");
      }
      const actualType =
        packageType === "authentication-component"
          ? "account-component"
          : packageType;
      const { id, files } = await createPackage({
        name,
        type: actualType,
        source: templates[example === "none" ? packageType : example],
        dependencies: scriptsDependencies[example],
        ownerKeyHash: await callerKeyHash(c),
      });
      return c.json<CreateScriptResponse>({
        package: {
          id,
          name,
          type: actualType,
          files,
          dependencies: scriptsDependencies[example],
        },
      });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .post("/import", rateLimit, async (c) => {
    try {
      const { packageSources } = await c.req
        .json<ImportScriptsRequestBody>()
        .catch(() => {
          throw invalidBody();
        });
      if (!isPackageSources(packageSources)) {
        throw invalidBody();
      }
      const packages = await importScriptsFromPackageSources(packageSources, {
        signal: c.req.raw.signal,
        ownerKeyHash: await callerKeyHash(c),
      });
      return c.json<ImportScriptsResponse>({ packages });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .post("/examples/:exampleId", rateLimit, async (c) => {
    try {
      const packages = await importExample(c.req.param("exampleId"), {
        signal: c.req.raw.signal,
        ownerKeyHash: await callerKeyHash(c),
      });
      return c.json<ImportScriptsResponse>({ packages });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .get("/:id", async (c) => {
    try {
      const id = packageId(c.req.param("id"));
      const dbPackage = await getPackage(id);
      if (!dbPackage) {
        throw notFound("Error: Package not found.");
      }
      const exports = dbPackage.exports as Export[];
      const { ownerKeyHash, ...publicPackage } = dbPackage;
      const dependencies =
        dbPackage.dependencies.length > 0
          ? await getDependencies(dbPackage.dependencies)
          : [];
      return c.json<GetScriptResponse>({
        package: {
          ...publicPackage,
          files: scriptFiles(dbPackage.name, dbPackage.files),
          // In the stored order, without the ones deleted since.
          dependencies: dbPackage.dependencies.flatMap((dependencyId) => {
            const dependency = dependencies.find(
              ({ id }) => id === dependencyId,
            );
            if (!dependency) {
              return [];
            }
            const { id, name, type, commitment } = dependency;
            return [{ id, name, type, commitment }];
          }),
          writable: isWritable({
            ownerKeyHash,
            tokenHash: await callerKeyHash(c),
          }),
          procedureExports: exports.map(
            (manifestExport) => manifestExport.Procedure,
          ),
          exports,
          createdAt: dbPackage.createdAt.getTime(),
          updatedAt: dbPackage.updatedAt.getTime(),
        },
      });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .patch("/:id", rateLimit, async (c) => {
    try {
      const id = packageId(c.req.param("id"));
      const tokenHash = await callerKeyHash(c);
      const { files, dependencies } = await c.req
        .json<CompileScriptRequestBody>()
        .catch(() => {
          throw invalidBody();
        });
      const source = files?.["src/lib.rs"];
      if (!isSource(source)) {
        throw invalidBody();
      }
      if (
        !isBoundedArray(dependencies) ||
        !isStringArray(dependencies) ||
        !dependencies.every(
          (dependency) =>
            isValidUUIDv4(dependency) ||
            Object.hasOwn(defaultDependenciesRecords, dependency),
        )
      ) {
        throw badRequest("Error: Invalid dependencies.");
      }
      const dbPackage = await getPackage(id);
      if (!dbPackage) {
        throw notFound("Error: Package not found.");
      }
      await authorizeWrite(dbPackage, tokenHash);
      const compiledPackage = await compilePackage({
        id,
        source,
        dependencies,
        signal: c.req.raw.signal,
      });
      return c.json<CompileScriptResponse>({ package: compiledPackage });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .delete("/:id", async (c) => {
    try {
      const id = packageId(c.req.param("id"));
      const tokenHash = await callerKeyHash(c);
      // Deleting a package that's already gone succeeds, as before.
      const dbPackage = await getPackage(id);
      if (dbPackage) {
        await authorizeWrite(dbPackage, tokenHash);
      }
      await deletePackage(id);
      return c.json<{ package: { id: string } }>({ package: { id } });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  // A copy of the package and of its dependencies, owned by the caller. No
  // compile: the copies keep the stored outputs.
  .post("/:id/fork", rateLimit, async (c) => {
    try {
      const rootId = packageId(c.req.param("id"));
      const ownerKeyHash = await callerKeyHash(c);
      const packages = await getPackageTree(rootId, MAX_PACKAGES);
      if (!packages) {
        throw notFound("Error: Package not found.");
      }
      if (packages.length > MAX_PACKAGES) {
        throw badRequest(
          `Error: This script has too many dependencies to fork (more than ${MAX_PACKAGES - 1}).`,
        );
      }
      const { id, copies } = forkPackages({
        rootId,
        packages,
        builtIns: defaultDependenciesRecords,
        newId: () => crypto.randomUUID(),
        ownerKeyHash,
      });
      await insertPackages(copies.map(({ row }) => row));
      return c.json<ForkScriptResponse>({
        package: { id },
        packages: copies.map(({ row, dependencies }) => ({
          id: row.id,
          name: row.name,
          type: row.type,
          status: row.status,
          files: scriptFiles(row.name, row.files),
          // rustc's output isn't stored: a fork of a script that doesn't
          // build shows it after its next compile.
          error: "",
          warnings: "",
          masm: row.masm,
          commitment: row.commitment,
          masp: row.masp,
          exports: row.exports,
          metadata: row.metadata,
          dependencies,
        })),
      });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .get("/:id/export", async (c) => {
    try {
      const id = packageId(c.req.param("id"));
      const dbPackage = await getPackage(id);
      if (!dbPackage) {
        throw notFound("Error: Package not found.");
      }
      const dependenciesPackages =
        dbPackage.dependencies.length > 0
          ? await getDependenciesDeep(dbPackage.dependencies)
          : [];
      const files = exportFiles(
        dbPackage.name,
        dbPackage.files,
        dependenciesPackages,
      );
      const zip = zipSync(
        Object.fromEntries(
          Object.entries(files).map(([path, content]) => [
            path,
            strToU8(content),
          ]),
        ),
        { level: 9 },
      );
      return c.body(zip, 200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${dbPackage.name}.zip"`,
      });
    } catch (error) {
      return errorResponse(c, error);
    }
  });

export default scripts;
