import { type NextRequest, NextResponse } from "next/server";
import { getPackage } from "@/db/packages";
import { API_REGISTRY_URL } from "@/lib/constants";
import { generateCargoToml, parseMidenProjectToml } from "@/lib/toml";
import type { PackageSource } from "@/lib/types";
import { projectTemplateFiles } from "@/lib/templates";

type VerifyNoteRequestBody = {
  noteId: string;
  packageSource?: PackageSource;
  dependencies?: PackageSource[];
  packageId?: string;
};

type VerifyNoteResponse = { verified: boolean };

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ network: string }> },
) => {
  try {
    const { network } = await params;
    const body = await request.json();
    const { noteId, packageSource, dependencies, packageId } =
      body as VerifyNoteRequestBody;
    if (packageSource && dependencies) {
      const {
        package: { name },
      } = parseMidenProjectToml(packageSource.midenProjectToml);
      const notePackageFiles = {
        [`${name}/.cargo/config.toml`]:
          projectTemplateFiles[".cargo/config.toml"],
        [`${name}/src/lib.rs`]: packageSource.rust,
        [`${name}/build.rs`]: projectTemplateFiles["build.rs"],
        [`${name}/Cargo.toml`]: generateCargoToml({ name }),
        [`${name}/miden-project.toml`]: packageSource.midenProjectToml,
        [`${name}/rust-toolchain.toml`]:
          projectTemplateFiles["rust-toolchain.toml"],
      };
      const files = dependencies.reduce<Record<string, string>>(
        (previousValue, currentValue) => {
          const {
            package: { name: dependencyName },
          } = parseMidenProjectToml(currentValue.midenProjectToml);
          previousValue[`${dependencyName}/.cargo/config.toml`] =
            projectTemplateFiles[".cargo/config.toml"];
          previousValue[`${dependencyName}/src/lib.rs`] = currentValue.rust;
          previousValue[`${dependencyName}/build.rs`] =
            projectTemplateFiles["build.rs"];
          previousValue[`${dependencyName}/miden-project.toml`] =
            currentValue.midenProjectToml;
          previousValue[`${dependencyName}/Cargo.toml`] = generateCargoToml({
            name: dependencyName,
          });
          previousValue[`${dependencyName}/rust-toolchain.toml`] =
            projectTemplateFiles["rust-toolchain.toml"];
          return previousValue;
        },
        notePackageFiles,
      );
      const response = await fetch(
        `${API_REGISTRY_URL}/v1/${network}/verified-notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            noteId,
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
      return NextResponse.json<VerifyNoteResponse>({ verified });
    } else if (packageId) {
      const dbPackage = await getPackage(packageId);
      if (!dbPackage) {
        throw new Error(`Package with ID ${packageId} not found.`);
      }
      const response = await fetch(
        `${API_REGISTRY_URL}/v1/${network}/verified-notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            noteId,
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
      return NextResponse.json<VerifyNoteResponse>({ verified });
    }
    throw new Error("Error: Invalid request body.");
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
