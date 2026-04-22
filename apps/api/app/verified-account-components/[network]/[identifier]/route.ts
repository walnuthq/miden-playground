import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedAccountComponents } from "@/db/verified-account-components";
import { type Export, type Package, type ProcedureExport } from "@/lib/types";
import { getStandardAccountComponent } from "@/lib/standard-account-components";
import { midenAccountComponentVerifier } from "@/lib/miden-verifier";

type VerifiedAccountComponentsResponse = {
  // legacy
  ok: boolean;
  components: (Omit<Package, "createdAt" | "updatedAt"> & {
    procedureExports: ProcedureExport[];
    createdAt: number;
    updatedAt: number;
  })[];
};

export const GET = async (
  _: NextRequest,
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
    return NextResponse.json<VerifiedAccountComponentsResponse>({
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
            exports,
            createdAt: dbPackage.createdAt.getTime(),
            updatedAt: dbPackage.updatedAt.getTime(),
          };
        }),
      ],
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
