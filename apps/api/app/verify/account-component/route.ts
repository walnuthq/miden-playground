import { type NextRequest, NextResponse } from "next/server";
import { midenVerifier } from "@/lib/miden-verifier";
import { insertVerifiedAccountComponent } from "@/db/verified-account-component";
import { compilePackage, newPackage } from "@/lib/miden-compiler";

type VerifyAccountComponentRequestBody = {
  accountId: string;
  cargoToml: string;
  rust: string;
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { accountId, cargoToml, rust } =
      body as VerifyAccountComponentRequestBody;
    const matches = cargoToml.match(/name\s+=\s+"(.*)"/);
    if (!matches) {
      throw new Error("Cannot read package name");
    }
    const [, name] = matches;
    if (!name) {
      throw new Error("Cannot read package name");
    }
    const { id } = await newPackage({ name, type: "account", rust });
    console.log("created", id);
    await compilePackage(id);
    console.log(id, "compiled");
    const verified = await midenVerifier({
      type: "account-component",
      resourceId: accountId,
      packageId: id,
    });
    console.log({ verified });
    if (verified) {
      await insertVerifiedAccountComponent({ accountId, packageId: id });
    }
    return NextResponse.json({ ok: true, verified });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false });
  }
};
