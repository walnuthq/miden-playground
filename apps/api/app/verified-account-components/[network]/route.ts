import { type NextRequest, NextResponse } from "next/server";
import { getPackage } from "@/db/packages";
import { API_REGISTRY_URL } from "@/lib/constants";
import { generateCargoToml, parseMidenProjectToml } from "@/lib/toml";
import type { PackageSource } from "@/lib/types";
import { projectTemplateFiles } from "@/lib/templates";

type VerifyAccountComponentRequestBody = {
  accountId: string;
  packageSource?: PackageSource;
  packageIds?: string[];
};

type VerifyAccountComponentResponse = { verified: boolean };

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ network: string }> },
) => {
  try {
    const { network } = await params;
    const body = await request.json();
    const { accountId, packageSource, packageIds } =
      body as VerifyAccountComponentRequestBody;
    if (packageSource) {
      const {
        package: { name },
      } = parseMidenProjectToml(packageSource.midenProjectToml);
      const files = {
        [`${name}/.cargo/config.toml`]:
          projectTemplateFiles[".cargo/config.toml"],
        [`${name}/src/lib.rs`]: packageSource.rust,
        [`${name}/build.rs`]: projectTemplateFiles["build.rs"],
        [`${name}/Cargo.toml`]: generateCargoToml({ name }),
        [`${name}/miden-project.toml`]: packageSource.midenProjectToml,
        [`${name}/rust-toolchain.toml`]:
          projectTemplateFiles["rust-toolchain.toml"],
      };
      const response = await fetch(
        `${API_REGISTRY_URL}/v1/${network}/verified-accounts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId,
            files,
            entrypoint: name,
            source: "miden-playground",
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        const { error } = result as { error: string };
        throw new Error(error);
      }
      const { verified } = result as { verified: boolean };
      return NextResponse.json<VerifyAccountComponentResponse>({ verified });
    } else if (packageIds) {
      const rawPackages = await Promise.all(
        packageIds.map((packageId) => getPackage(packageId)),
      );
      const packages = rawPackages.filter(
        (dbPackage) => dbPackage !== undefined,
      );
      const verifiedList = await Promise.all(
        packages.map(async (dbPackage) => {
          const response = await fetch(
            `${API_REGISTRY_URL}/v1/${network}/verified-accounts`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accountId,
                files: dbPackage.files,
                entrypoint: dbPackage.name,
              }),
            },
          );
          const result = await response.json();
          if (!response.ok) {
            const { error } = result as { error: string };
            throw new Error(error);
          }
          const { verified } = result as { verified: boolean };
          return verified;
        }),
      );
      const verified = verifiedList.every((v) => v);
      return NextResponse.json<VerifyAccountComponentResponse>({ verified });
    }
    throw new Error("Error: Invalid request body.");
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
