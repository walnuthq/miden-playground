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
  parseMidenProjectToml,
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
import { PACKAGES_PATH, API_REGISTRY_URL } from "@/lib/constants";
import { generateCargoToml, safeRm } from "@/lib/utils";
import type { PackageSource } from "@/lib/types";
import { projectTemplateFiles } from "@/lib/templates";

type VerifyAccountComponentRequestBody = {
  accountId: string;
  identifier: string;
  account?: string;
  //
  packageSource?: PackageSource;
  //
  packageIds?: string[];
};

type VerifyAccountComponentResponse = { verified: boolean };

const verifyAccountComponentFromSource = async ({
  networkId,
  identifier,
  accountId,
  account,
  packageSource: { midenProjectToml, rust },
}: {
  networkId: string;
  identifier: string;
  accountId: string;
  account?: string;
  packageSource: PackageSource;
}) => {
  const {
    package: { name },
  } = parseMidenProjectToml(midenProjectToml);
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
  const { masp, digest, exports } = await readPackage({ packageDir: id, name });
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
    maspPath: packagePath({ packageDir: id, name }),
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
        maspPath: packagePath({ packageDir: packageId, name }),
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
      if (account) {
        const {
          package: { name },
        } = parseMidenProjectToml(packageSource.midenProjectToml);
        const files = {
          [`${name}/.cargo/config.toml`]:
            projectTemplateFiles[".cargo/config.toml"],
          [`${name}/src/lib.rs`]: packageSource.rust,
          [`${name}/Cargo.toml`]: generateCargoToml({ name }),
          [`${name}/miden-project.toml`]: packageSource.midenProjectToml,
          [`${name}/rust-toolchain.toml`]:
            projectTemplateFiles["rust-toolchain.toml"],
        };
        try {
          await fetch(`${API_REGISTRY_URL}/v1/${network}/verified-accounts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountId,
              files,
              entrypoint: name,
              source: "miden-playground",
            }),
          });
        } catch (error) {
          console.error(error);
        }
      }
      return NextResponse.json<VerifyAccountComponentResponse>({ verified });
    } else if (account && packageIds) {
      const rawPackages = await Promise.all(
        packageIds.map((packageId) => getPackage(packageId)),
      );
      const packages = rawPackages.filter(
        (dbPackage) => dbPackage !== undefined,
      );
      await Promise.all(
        packages.map(async (dbPackage) => {
          await generatePackageDir({
            packageDir: dbPackage.id,
            name: dbPackage.name,
            type: dbPackage.type,
            rust: dbPackage.rust,
            dependencies: dbPackage.dependencies,
          });
          await compilePackage({
            packageDir: dbPackage.id,
            name: dbPackage.name,
          });
        }),
      );
      const verified = await verifyAccountComponentsFromPackageIds({
        networkId: network,
        identifier,
        accountId,
        account,
        packageIds,
      });
      // const verifiedList = await Promise.all(
      //   packages.map(async (dbPackage) => {
      //     console.log(dbPackage.files);
      //     console.log(`${API_REGISTRY_URL}/v1/${network}/verified-accounts`);
      //     const response = await fetch(
      //       `${API_REGISTRY_URL}/v1/${network}/verified-accounts`,
      //       {
      //         method: "POST",
      //         headers: { "Content-Type": "application/json" },
      //         body: JSON.stringify({
      //           accountId,
      //           files: dbPackage.files,
      //           entrypoint: dbPackage.name,
      //         }),
      //       },
      //     );
      //     const result = await response.json();
      //     if (!response.ok) {
      //       const { error } = result as { error: string };
      //       throw new Error(error);
      //     }
      //     const { verified } = result as { verified: boolean };
      //     return verified;
      //   }),
      // );
      // const verified = verifiedList.every((v) => v);
      return NextResponse.json<VerifyAccountComponentResponse>({ verified });
    }
    throw new Error("Error: Invalid request body.");
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
