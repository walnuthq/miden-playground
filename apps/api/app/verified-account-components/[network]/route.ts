import { writeFile } from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import {
  getVerifiedAccountComponent,
  insertVerifiedAccountComponent,
} from "@/db/verified-account-components";
import { midenAccountComponentVerifier } from "@/lib/miden-verifier";
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
import { safeRm } from "@/lib/utils";
import { type PackageSource } from "@/lib/types";

type VerifyAccountComponentRequestBody = {
  accountId: string;
  identifier: string;
  account?: string;
  //
  packageSource?: PackageSource;
  //
  packageIds?: string[];
};

const verifyAccountComponentFromSource = async ({
  networkId,
  identifier,
  accountId,
  account,
  packageSource: { cargoToml, rust },
}: {
  networkId: string;
  identifier: string;
  accountId: string;
  account?: string;
  packageSource: PackageSource;
}) => {
  const {
    package: { name },
  } = parseCargoToml(cargoToml);
  const { id } = await newPackage({
    name,
    type: "account",
    rust,
    readOnly: true,
  });
  const { stderr } = await compilePackage({ packageDir: id, name });
  if (stderr) {
    await Promise.all([deletePackageDir(id), deletePackage(id)]);
    throw new Error("Error: Account Component compilation failed.");
  }
  const { masp, digest, exports } = await readPackage(id);
  await updatePackage({
    id,
    status: "compiled",
    digest,
    masp,
    exports,
  });
  const resourcePath = `${PACKAGES_PATH}/${accountId}.txt`;
  if (account) {
    await writeFile(resourcePath, account);
  }
  const accountComponents = await midenAccountComponentVerifier({
    networkId,
    resourceId: accountId,
    resourcePath: account ? resourcePath : undefined,
    maspPath: packagePath(id),
  });
  if (account) {
    await safeRm(resourcePath);
  }
  const customAccountComponent = accountComponents.find((accountComponent) =>
    accountComponent.startsWith("Custom"),
  );
  if (!customAccountComponent) {
    await Promise.all([deletePackageDir(id), deletePackage(id)]);
    return false;
  }
  const readOnlyPackage = await getReadOnlyPackage({ id, digest });
  if (readOnlyPackage) {
    await Promise.all([deletePackageDir(id), deletePackage(id)]);
  }
  const readOnlyPackageId = readOnlyPackage?.id ?? id;
  const verifiedAccountComponent = await getVerifiedAccountComponent({
    accountId,
    packageId: readOnlyPackageId,
  });
  if (verifiedAccountComponent) {
    throw new Error("Error: Account Component already verified.");
  }
  await insertVerifiedAccountComponent({
    networkId,
    identifier,
    accountId,
    packageId: readOnlyPackageId,
  });
  return true;
};

const verifyAccountComponentsFromPackageIds = async ({
  networkId,
  identifier,
  accountId,
  account,
  packageIds,
}: {
  networkId: string;
  identifier: string;
  accountId: string;
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
      const accountComponents = await midenAccountComponentVerifier({
        networkId,
        resourceId: accountId,
        resourcePath,
        maspPath: packagePath(packageId),
      });
      const customAccountComponent = accountComponents.find(
        (accountComponent) => accountComponent.startsWith("Custom"),
      );
      await safeRm(resourcePath);
      if (!customAccountComponent) {
        return false;
      }
      const readOnlyPackage = await getReadOnlyPackage({ digest });
      const readOnlyPackageId = readOnlyPackage
        ? readOnlyPackage.id
        : await insertPackage({ ...dbPackage, id: undefined, readOnly: true });
      await insertVerifiedAccountComponent({
        networkId,
        identifier,
        accountId,
        packageId: readOnlyPackageId,
      });
      return true;
    }),
  );
  return result.every((verified) => verified);
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ network: string }> },
) => {
  try {
    const { network } = await params;
    const body = await request.json();
    const { accountId, identifier, account, packageSource, packageIds } =
      body as VerifyAccountComponentRequestBody;
    if (packageSource) {
      const verified = await verifyAccountComponentFromSource({
        networkId: network,
        identifier,
        accountId,
        account,
        packageSource,
      });
      return NextResponse.json({ ok: true, verified });
    } else if (account && packageIds) {
      const verified = await verifyAccountComponentsFromPackageIds({
        networkId: network,
        identifier,
        accountId,
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
