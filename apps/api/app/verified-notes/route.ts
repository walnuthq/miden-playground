import { writeFile } from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedNote, insertVerifiedNote } from "@/db/verified-notes";
import { midenVerifier } from "@/lib/miden-verifier";
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

type VerifyNoteRequestBody = {
  noteId: string;
  note?: string;
  //
  cargoToml?: string;
  rust?: string;
  //
  packageId?: string;
};

const verifyNoteFromSource = async ({
  noteId,
  note,
  cargoToml,
  rust,
}: {
  noteId: string;
  note?: string;
  cargoToml: string;
  rust: string;
}) => {
  const {
    package: {
      name,
      // metadata: {
      //   miden: { dependencies: cargoTomlDependencies },
      // },
    },
  } = parseCargoToml(cargoToml);
  const { id } = await newPackage({ name, type: "note-script", rust });
  const { stderr } = await compilePackage(id);
  if (stderr) {
    await Promise.all([deletePackageDir(id), deletePackage(id)]);
    throw new Error("Error: Note Script compilation failed.");
  }
  const { masp, digest, exports, dependencies } = await readPackage({
    packageDir: id,
    name,
  });
  const resourcePath = `${PACKAGES_PATH}/${noteId}.txt`;
  if (note) {
    await writeFile(resourcePath, note);
  }
  const verified = await midenVerifier({
    resourceType: "note",
    resourceId: noteId,
    resourcePath: note ? resourcePath : undefined,
    maspPath: packagePath({ packageDir: id, name }),
  });
  if (!verified) {
    await Promise.all([deletePackageDir(id), deletePackage(id)]);
    throw new Error("Error: Note Script verification failed.");
  }
  const verifiedNote = await getVerifiedNote(noteId);
  if (verifiedNote) {
    await Promise.all([deletePackageDir(id), deletePackage(id)]);
    throw new Error("Error: Note Script already verified.");
  }
  await Promise.all([
    updatePackage({
      id,
      status: "compiled",
      digest,
      masp,
      exports,
      dependencies: dependencies.map(({ id }) => id),
    }),
    insertVerifiedNote({ noteId, packageId: id }),
  ]);
  return true;
};

const verifyNoteFromPackageId = async ({
  noteId,
  note,
  packageId,
}: {
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
  const verified = await midenVerifier({
    resourceType: "note",
    resourceId: noteId,
    resourcePath,
    maspPath: packagePath({ packageDir: packageId, name }),
  });
  if (!verified) {
    throw new Error("Error: Note Script verification failed.");
  }
  const readOnlyPackage = await getReadOnlyPackage(digest);
  const id = readOnlyPackage
    ? readOnlyPackage.id
    : await insertPackage({ ...dbPackage, id: undefined, readOnly: true });
  await insertVerifiedNote({
    noteId,
    packageId: id,
  });
  return true;
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { noteId, note, cargoToml, rust, packageId } =
      body as VerifyNoteRequestBody;
    if (cargoToml && rust) {
      const verified = await verifyNoteFromSource({
        noteId,
        note,
        cargoToml,
        rust,
      });
      return NextResponse.json({ ok: true, verified });
    } else if (note && packageId) {
      const verified = await verifyNoteFromPackageId({
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
