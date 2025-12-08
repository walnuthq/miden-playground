import { type NextRequest, NextResponse } from "next/server";
import { v4 } from "uuid";
import { newPackage } from "@/lib/miden-compiler";

type CreateScriptRequestBody = {
  name: string;
  type: string;
  example: string;
};

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { name, type, example } = body as CreateScriptRequestBody;
  const id = v4();
  const { rust, dependencies } = await newPackage({
    packageDir: id,
    name,
    type,
    example,
  });
  return NextResponse.json({ id, rust, dependencies });
};
