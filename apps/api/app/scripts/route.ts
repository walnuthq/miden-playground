import { type NextRequest, NextResponse } from "next/server";
import { v4 } from "uuid";
import { newPackage, readRust } from "@/lib/miden-compiler";

type CreateScriptRequestBody = { packageName: string };

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { packageName } = body as CreateScriptRequestBody;
  const id = `${packageName}-${v4()}`;
  // const id = packageName;
  // console.info(`cargo miden new ${id} --name ${packageName}`);
  await newPackage(id);
  console.info(`cat /tmp/${id}/src/lib.rs`);
  const rust = await readRust(id);
  return NextResponse.json({ id, rust });
};
