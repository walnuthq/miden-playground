import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedNotes } from "@/db/verified-notes";
import { midenNoteVerifier } from "@/lib/miden-verifier";
import { getStandardNoteScript } from "@/lib/default-note-scripts";
import { getDependencies } from "@/db/packages";
import type { Package, ProcedureExport, Export, Dependency } from "@/lib/types";

type VerifiedNotesResponse = {
  // legacy
  ok: boolean;
  noteScript:
    | (Omit<Package, "dependencies" | "createdAt" | "updatedAt"> & {
        dependencies: (Dependency & { rust: string })[];
        procedureExports: ProcedureExport[];
        createdAt: number;
        updatedAt: number;
      })
    | null;
};

export const GET = async (
  _: NextRequest,
  { params }: { params: Promise<{ network: string; id: string }> },
) => {
  try {
    const { network, id } = await params;
    const [noteScript, verifiedNotes] = await Promise.all([
      midenNoteVerifier({ networkId: network, resourceId: id }),
      getVerifiedNotes({
        networkId: network,
        noteId: id,
      }),
    ]);
    const standardNoteScript = getStandardNoteScript(noteScript);
    if (standardNoteScript) {
      return NextResponse.json<VerifiedNotesResponse>({
        ok: true,
        noteScript: {
          ...standardNoteScript,
          dependencies: [],
          procedureExports: [],
          createdAt: standardNoteScript.createdAt.getTime(),
          updatedAt: standardNoteScript.updatedAt.getTime(),
        },
      });
    }
    const [verifiedNote = null] = verifiedNotes;
    if (verifiedNote) {
      const { package: dbPackage } = verifiedNote;
      const exports = dbPackage.exports as Export[];
      const dependencies =
        dbPackage.dependencies.length > 0
          ? await getDependencies(dbPackage.dependencies)
          : [];
      return NextResponse.json<VerifiedNotesResponse>({
        ok: true,
        noteScript: {
          ...dbPackage,
          dependencies,
          exports,
          procedureExports: [],
          createdAt: dbPackage.createdAt.getTime(),
          updatedAt: dbPackage.updatedAt.getTime(),
        },
      });
    }
    return NextResponse.json<VerifiedNotesResponse>({
      ok: true,
      noteScript: null,
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
