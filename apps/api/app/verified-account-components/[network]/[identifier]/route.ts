import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedAccountComponents } from "@/db/verified-account-components";
import { type Export } from "@/lib/types";
import { getStandardAccountComponent } from "@/lib/default-account-components";
import { midenAccountComponentVerifier } from "@/lib/miden-verifier";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ network: string; identifier: string }> },
) => {
  try {
    const { network, identifier } = await params;
    const [accountComponents, verifiedAccountComponents] = await Promise.all([
      midenAccountComponentVerifier({
        networkId: network,
        resourceId: identifier,
      }),
      getVerifiedAccountComponents({
        networkId: network,
        identifier,
      }),
    ]);
    const standardAccountComponents = accountComponents
      .map((accountComponent) => getStandardAccountComponent(accountComponent))
      .filter((standardAccountComponent) => !!standardAccountComponent);
    return NextResponse.json({
      ok: true,
      components: [
        ...standardAccountComponents.map((standardAccountComponent) => ({
          ...standardAccountComponent,
          procedureExports: standardAccountComponent.exports.map(
            (manifestExport) => manifestExport.Procedure,
          ),
          createdAt: standardAccountComponent.createdAt.getTime(),
          updatedAt: standardAccountComponent.updatedAt.getTime(),
        })),
        ...verifiedAccountComponents.map(({ package: dbPackage }) => {
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
      ],
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
