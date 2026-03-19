import { mkdir, cp, readFile, writeFile } from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import { safeRm } from "@/lib/utils";
import { getPackage, getDependencies } from "@/db/packages";
import { packageExists, generatePackageDir } from "@/lib/miden-compiler";
import { PACKAGES_PATH } from "@/lib/constants";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const [exists, dbPackage] = await Promise.all([
      packageExists(id),
      getPackage(id),
    ]);
    if (!dbPackage) {
      throw new Error("Error: Package not found");
    }
    const { name, type, rust, dependencies } = dbPackage;
    if (!exists) {
      await generatePackageDir({
        packageDir: id,
        name,
        type,
        rust,
        dependencies,
      });
    }
    // Create readable stream for the zip
    const archive = archiver("zip", {
      zlib: { level: 9 }, // max compression
    });
    // Create response stream
    const stream = new ReadableStream({
      async start(controller) {
        // Pipe archive errors to stream
        archive.on("error", (err) => {
          console.error("Archiver error:", err);
          controller.error(err);
        });
        // When data is ready → enqueue to stream
        archive.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        // When finished → close stream
        archive.on("end", () => {
          controller.close();
        });
        await mkdir(`${PACKAGES_PATH}/${id}-export`);
        const copyOptions = {
          recursive: true,
          filter: (source: string) =>
            !source.includes("target") && !source.includes("Cargo.lock"),
        };
        await cp(
          `${PACKAGES_PATH}/${id}`,
          `${PACKAGES_PATH}/${id}-export/${name}`,
          copyOptions,
        );
        let cargoToml = await readFile(
          `${PACKAGES_PATH}/${id}-export/${name}/Cargo.toml`,
          "utf-8",
        );
        const dependenciesPackages =
          dependencies.length > 0 ? await getDependencies(dependencies) : [];
        dependenciesPackages.forEach((dependencyPackage) => {
          cargoToml = cargoToml.replaceAll(
            `/tmp/${dependencyPackage.id}`,
            `../${dependencyPackage.name}`,
          );
        });
        await writeFile(
          `${PACKAGES_PATH}/${id}-export/${name}/Cargo.toml`,
          cargoToml,
        );
        await Promise.all(
          dependenciesPackages.map((dependencyPackage) =>
            cp(
              `${PACKAGES_PATH}/${dependencyPackage.id}`,
              `${PACKAGES_PATH}/${id}-export/${dependencyPackage.name}`,
              copyOptions,
            ),
          ),
        );
        archive.directory(`${PACKAGES_PATH}/${id}-export`, false);
        // Finalize (start zipping)
        await archive.finalize();
        await safeRm(`${PACKAGES_PATH}/${id}-export`, {
          recursive: true,
          force: true,
        });
      },
    });
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${name}.zip"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error exporting script", { status: 500 });
  }
};
