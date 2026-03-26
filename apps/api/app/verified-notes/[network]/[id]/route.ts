import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedNotes } from "@/db/verified-notes";
import { midenNoteVerifier } from "@/lib/miden-verifier";
import { getStandardNoteScript } from "@/lib/default-note-scripts";

export const GET = async (
  request: NextRequest,
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
      return NextResponse.json({
        ok: true,
        noteScript: {
          ...standardNoteScript,
          createdAt: standardNoteScript.createdAt.getTime(),
          updatedAt: standardNoteScript.updatedAt.getTime(),
        },
      });
    }
    const [verifiedNote = null] = verifiedNotes;
    if (verifiedNote) {
      const { package: dbPackage } = verifiedNote;
      return NextResponse.json({
        ok: true,
        noteScript: {
          ...dbPackage,
          createdAt: dbPackage.createdAt.getTime(),
          updatedAt: dbPackage.updatedAt.getTime(),
        },
      });
    }
    return NextResponse.json({ ok: true, noteScript: null });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
