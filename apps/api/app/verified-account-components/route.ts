import { writeFile } from "node:fs/promises";
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
  packagePath,
  packageExists,
  generatePackageDir,
} from "@/lib/miden-compiler";
import {
  deletePackage,
  getPackage,
  updatePackage,
  insertPackage,
  getReadOnlyPackage,
} from "@/db/packages";
import { PACKAGES_PATH } from "@/lib/constants";

type VerifyAccountComponentRequestBody = {
  accountId: string;
  identifier: string;
  account?: string;
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
  account?: string;
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
  const resourcePath = `${PACKAGES_PATH}/${accountId}.txt`;
  if (account) {
    await writeFile(resourcePath, account);
  }
  const verified = await midenVerifier({
    resourceType: "account-component",
    resourceId: accountId,
    resourcePath: account ? resourcePath : undefined,
    maspPath: packagePath({ packageDir: id, name }),
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
      const [exists, dbPackage] = await Promise.all([
        packageExists(packageId),
        getPackage(packageId),
      ]);
      if (!dbPackage) {
        throw new Error(`Error: Package ${packageId} not found.`);
      }
      const { name, type, rust, dependencies, digest } = dbPackage;
      if (!exists) {
        await generatePackageDir({
          packageDir: packageId,
          name,
          type,
          rust,
          dependencies,
        });
      }
      const resourcePath = `${PACKAGES_PATH}/${accountId}.txt`;
      await writeFile(resourcePath, account);
      const verified = await midenVerifier({
        resourceType: "account-component",
        resourceId: accountId,
        resourcePath,
        maspPath: packagePath({ packageDir: packageId, name }),
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
      return NextResponse.json({ ok: true, verified });
    } else if (account && packageIds) {
      const verified = await verifyAccountComponentsFromPackageIds({
        accountId,
        identifier,
        account,
        packageIds,
      });
      return NextResponse.json({ ok: true, verified });
    }
    throw new Error("Error: Invalid request body.");
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
