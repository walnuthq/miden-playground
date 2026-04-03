import { writeFile } from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedNote, insertVerifiedNote } from "@/db/verified-notes";
import { midenNoteVerifier } from "@/lib/miden-verifier";
import {
  compilePackage,
  newPackage,
  deletePackageDir,
  readPackage,
  parseCargoToml,
  packagePath,
  packageExists,
  generatePackageDir,
} from "@/lib/miden-compiler";
import {
  deletePackage,
  getPackage,
  updatePackage,
  insertPackage,
  getReadOnlyPackage,
} from "@/db/packages";
import { PACKAGES_PATH } from "@/lib/constants";
import { safeRm } from "@/lib/utils";
import { type PackageSource } from "@/lib/types";

type VerifyNoteRequestBody = {
  noteId: string;
  note?: string;
  //
  packageSource?: PackageSource;
  dependencies?: PackageSource[];
  //
  packageId?: string;
};

const deletePackages = async (packages: { id: string }[]) =>
  Promise.all(
    packages.map(({ id }) =>
      Promise.all([deletePackageDir(id), deletePackage(id)]),
    ),
  );

const verifyNoteFromSource = async ({
  networkId,
  noteId,
  note,
  packageSource,
  dependencies,
}: {
  networkId: string;
  noteId: string;
  note?: string;
  packageSource: PackageSource;
  dependencies: PackageSource[];
}) => {
  const dependenciesPackages = await Promise.all(
    dependencies.map(({ cargoToml, rust }) => {
      const {
        package: {
          name,
          metadata: {
            miden: { "project-kind": type },
          },
        },
      } = parseCargoToml(cargoToml);
      return newPackage({ name, type, rust, readOnly: true });
    }),
  );
  const {
    package: {
      name: notePackageName,
      metadata: {
        miden: {
          "project-kind": notePackageType,
          dependencies: rawNotePackageDependencies,
        },
      },
    },
  } = parseCargoToml(packageSource.cargoToml);
  const notePackageDependencies = rawNotePackageDependencies
    ? Object.keys(rawNotePackageDependencies)
        .map((dependency) => dependency.slice(dependency.indexOf(":") + 1))
        .map((dependency) =>
          dependenciesPackages.find(({ name }) => name === dependency),
        )
        .filter((dependency) => dependency !== undefined)
        .map(({ id, name, type }) => ({ id, name, type, digest: "" }))
    : [];
  const notePackage = await newPackage({
    name: notePackageName,
    type: notePackageType,
    rust: packageSource.rust,
    readOnly: true,
    dependencies: notePackageDependencies,
  });
  const { stderr } = await compilePackage({
    packageDir: notePackage.id,
    name: notePackage.name,
  });
  if (stderr) {
    await deletePackages([notePackage, ...dependenciesPackages]);
    throw new Error("Error: Note Script compilation failed.");
  }
  const { masp, digest, exports } = await readPackage(notePackage.id);
  await updatePackage({
    id: notePackage.id,
    status: "compiled",
    digest,
    masp,
    exports,
  });
  const resourcePath = `${PACKAGES_PATH}/${noteId}.txt`;
  if (note) {
    await writeFile(resourcePath, note);
  }
  const noteScript = await midenNoteVerifier({
    networkId,
    resourceId: noteId,
    resourcePath: note ? resourcePath : undefined,
    maspPath: packagePath(notePackage.id),
  });
  if (note) {
    await safeRm(resourcePath);
  }
  if (!noteScript.startsWith("Custom")) {
    await deletePackages([notePackage, ...dependenciesPackages]);
    return false;
  }
  const readOnlyPackage = await getReadOnlyPackage({
    id: notePackage.id,
    digest,
  });
  if (readOnlyPackage) {
    await deletePackages([notePackage, ...dependenciesPackages]);
  }
  const readOnlyPackageId = readOnlyPackage?.id ?? notePackage.id;
  const verifiedNote = await getVerifiedNote({
    noteId,
    packageId: readOnlyPackageId,
  });
  if (verifiedNote) {
    throw new Error("Error: Note Script already verified.");
  }
  await insertVerifiedNote({ networkId, noteId, packageId: readOnlyPackageId });
  return true;
};

const verifyNoteFromPackageId = async ({
  networkId,
  noteId,
  note,
  packageId,
}: {
  networkId: string;
  noteId: string;
  note: string;
  packageId: string;
}) => {
  const [exists, dbPackage] = await Promise.all([
    packageExists(packageId),
    getPackage(packageId),
  ]);
  if (!dbPackage) {
    throw new Error(`Error: Package ${packageId} not found.`);
  }
  const { name, type, rust, dependencies, digest } = dbPackage;
  if (!exists) {
    await generatePackageDir({
      packageDir: packageId,
      name,
      type,
      rust,
      dependencies,
    });
  }
  const resourcePath = `${PACKAGES_PATH}/${noteId}.txt`;
  await writeFile(resourcePath, note);
  const noteScript = await midenNoteVerifier({
    networkId,
    resourceId: noteId,
    resourcePath,
    maspPath: packagePath(packageId),
  });
  await safeRm(resourcePath);
  if (!noteScript.startsWith("Custom")) {
    return false;
  }
  const readOnlyPackage = await getReadOnlyPackage({ digest });
  const readOnlyPackageId = readOnlyPackage
    ? readOnlyPackage.id
    : await insertPackage({ ...dbPackage, id: undefined, readOnly: true });
  await insertVerifiedNote({ networkId, noteId, packageId: readOnlyPackageId });
  return true;
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ network: string }> },
) => {
  try {
    const { network } = await params;
    const body = await request.json();
    const { noteId, note, packageSource, dependencies, packageId } =
      body as VerifyNoteRequestBody;
    if (packageSource && dependencies) {
      const verified = await verifyNoteFromSource({
        networkId: network,
        noteId,
        note,
        packageSource,
        dependencies,
      });
      return NextResponse.json({ ok: true, verified });
    } else if (note && packageId) {
      const verified = await verifyNoteFromPackageId({
        networkId: network,
        noteId,
        note,
        packageId,
      });
      return NextResponse.json({ ok: true, verified });
    }
    throw new Error("Error: Invalid request body.");
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
