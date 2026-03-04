import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedNotes } from "@/db/verified-notes";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ network: string; id: string }> },
) => {
  try {
    const { network, id } = await params;
    const verifiedNotes = await getVerifiedNotes({
      networkId: network,
      noteId: id,
    });
    const [verifiedNote = null] = verifiedNotes;
    if (!verifiedNote) {
      return NextResponse.json({ ok: true, noteScript: null });
    }
    const { package: dbPackage } = verifiedNote;
    return NextResponse.json({
      ok: true,
      noteScript: dbPackage,
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
