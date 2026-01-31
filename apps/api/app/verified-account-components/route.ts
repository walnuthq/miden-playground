import { type NextRequest, NextResponse } from "next/server";
import {
  getVerifiedAccountComponent,
  insertVerifiedAccountComponent,
} from "@/db/verified-account-components";
import { midenVerifier } from "@/lib/miden-verifier";
import {
  compilePackage,
  newPackage,
  deletePackageDir,
  readPackage,
  parseCargoToml,
} from "@/lib/miden-compiler";
import {
  deletePackage,
  getPackage,
  updatePackage,
  insertPackage,
  getReadOnlyPackage,
} from "@/db/packages";

type VerifyAccountComponentRequestBody = {
  accountId: string;
  identifier: string;
  account: string;
  //
  cargoToml?: string;
  rust?: string;
  //
  packageIds?: string[];
};

const verifyAccountComponentFromSource = async ({
  accountId,
  identifier,
  account,
  cargoToml,
  rust,
}: {
  accountId: string;
  identifier: string;
  account: string;
  cargoToml: string;
  rust: string;
}) => {
  const {
    package: { name },
  } = parseCargoToml(cargoToml);
  const { id } = await newPackage({ name, type: "account", rust });
  const { stderr } = await compilePackage(id);
  if (stderr) {
    await Promise.all([deletePackageDir(id), deletePackage(id)]);
    throw new Error("Error: Account Component compilation failed.");
  }
  const { masp, digest, exports, dependencies } = await readPackage({
    packageDir: id,
    name,
  });
  const verified = await midenVerifier({
    type: "account-component",
    resource: account,
    masp,
  });
  if (!verified) {
    await Promise.all([deletePackageDir(id), deletePackage(id)]);
    throw new Error("Error: Account Component verification failed.");
  }
  const verifiedAccountComponent = await getVerifiedAccountComponent({
    accountId,
    packageId: id,
  });
  if (verifiedAccountComponent) {
    await Promise.all([deletePackageDir(id), deletePackage(id)]);
    throw new Error("Error: Account Component already verified.");
  }
  await Promise.all([
    updatePackage({
      id,
      status: "compiled",
      digest,
      masp,
      exports,
      dependencies: dependencies.map(({ id }) => id),
    }),
    insertVerifiedAccountComponent({ accountId, packageId: id, identifier }),
  ]);
  return true;
};

const verifyAccountComponentsFromPackageIds = async ({
  accountId,
  identifier,
  account,
  packageIds,
}: {
  accountId: string;
  identifier: string;
  account: string;
  packageIds: string[];
}) => {
  const result = await Promise.all(
    packageIds.map(async (packageId) => {
      const dbPackage = await getPackage(packageId);
      if (!dbPackage) {
        throw new Error(`Error: Package ${packageId} not found.`);
      }
      const { masp, digest } = dbPackage;
      const verified = await midenVerifier({
        type: "account-component",
        resource: account,
        masp,
      });
      if (!verified) {
        throw new Error("Error: Account Component verification failed.");
      }
      const readOnlyPackage = await getReadOnlyPackage(digest);
      const id = readOnlyPackage
        ? readOnlyPackage.id
        : await insertPackage({ ...dbPackage, id: undefined, readOnly: true });
      await insertVerifiedAccountComponent({
        accountId,
        packageId: id,
        identifier,
      });
      return true;
    }),
  );
  return result.every((verified) => verified);
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { accountId, identifier, account, cargoToml, rust, packageIds } =
      body as VerifyAccountComponentRequestBody;
    if (cargoToml && rust) {
      const verified = await verifyAccountComponentFromSource({
        accountId,
        identifier,
        account,
        cargoToml,
        rust,
      });
      return NextResponse.json({ ok: verified });
    } else if (packageIds) {
      const verified = await verifyAccountComponentsFromPackageIds({
        accountId,
        identifier,
        account,
        packageIds,
      });
      return NextResponse.json({ ok: verified });
    }
    throw new Error("Error: Invalid request body.");
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return NextResponse.json({ ok: false, error: message });
  }
};
