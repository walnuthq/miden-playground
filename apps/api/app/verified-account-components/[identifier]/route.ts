import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedAccountComponents } from "@/db/verified-account-components";
import { type Export } from "@/lib/types";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> },
) => {
  try {
    const { identifier } = await params;
    const verifiedAccountComponents =
      await getVerifiedAccountComponents(identifier);
    return NextResponse.json({
      ok: true,
      components: verifiedAccountComponents.map(({ package: dbPackage }) => {
        const exports = dbPackage.exports as Export[];
        return {
          ...dbPackage,
          procedureExports: exports.map(
            (manifestExport) => manifestExport.Procedure,
          ),
          createdAt: dbPackage.createdAt.getTime(),
          updatedAt: dbPackage.updatedAt.getTime(),
        };
      }),
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return NextResponse.json({ ok: false, error: message });
  }
};
