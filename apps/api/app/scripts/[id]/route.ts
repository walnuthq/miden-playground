import { type NextRequest, NextResponse } from "next/server";
import type {
  CompiledPackage,
  Package,
  ProcedureExport,
  Export,
} from "@/lib/types";
import { getPackage, deletePackage } from "@/db/packages";
import { compilePackage } from "@/lib/utils";

type GetScriptResponse = {
  package: Omit<Package, "createdAt" | "updatedAt"> & {
    procedureExports: ProcedureExport[];
    createdAt: number;
    updatedAt: number;
  };
};

export const GET = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const dbPackage = await getPackage(id);
    if (!dbPackage) {
      throw new Error("Error: Package not found.");
    }
    const exports = dbPackage.exports as Export[];
    return NextResponse.json<GetScriptResponse>({
      package: {
        ...dbPackage,
        procedureExports: exports.map(
          (manifestExport) => manifestExport.Procedure,
        ),
        exports,
        createdAt: dbPackage.createdAt.getTime(),
        updatedAt: dbPackage.updatedAt.getTime(),
      },
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};

type CompileScriptRequestBody = {
  name: string;
  rust: string;
  dependencies: string[];
};

type CompileScriptResponse = { package: CompiledPackage };

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rust, dependencies } = body as CompileScriptRequestBody;
    const compiledPackage = await compilePackage({ id, rust, dependencies });
    return NextResponse.json<CompileScriptResponse>({
      package: compiledPackage,
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    await deletePackage(id);
    return NextResponse.json<{ package: { id: string } }>({ package: { id } });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
