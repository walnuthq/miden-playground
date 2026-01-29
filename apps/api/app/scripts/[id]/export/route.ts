import { type NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import { getPackage } from "@/db/packages";
import { packageExists, generatePackageDir } from "@/lib/miden-compiler";
import { packagesPath } from "@/lib/constants";

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
        // Add folder contents (root level - no parent folder in zip)
        // archive.directory(`${packagesPath}/${id}`, false);
        archive.glob("**", {
          cwd: `${packagesPath}/${id}`,
          ignore: "target/**",
        });
        // Finalize (start zipping)
        await archive.finalize();
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
