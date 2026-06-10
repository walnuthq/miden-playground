import { type NextRequest, NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { getPackage, getDependencies } from "@/db/packages";

export const GET = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const dbPackage = await getPackage(id);
    if (!dbPackage) {
      throw new Error("Error: Package not found");
    }
    const dependenciesPackages =
      dbPackage.dependencies.length > 0
        ? await getDependencies(dbPackage.dependencies)
        : [];
    const files =
      dbPackage.dependencies.length > 0
        ? dependenciesPackages.reduce<Record<string, string>>(
            (previousValue, currentValue) => {
              for (const [path, content] of Object.entries(
                currentValue.files,
              )) {
                previousValue[path] = content;
              }
              return previousValue;
            },
            dbPackage.files,
          )
        : Object.entries(dbPackage.files).reduce<Record<string, string>>(
            (previousValue, [path, content]) => {
              const strippedPath = path.split("/").slice(1).join("/");
              previousValue[strippedPath] = content;
              return previousValue;
            },
            {},
          );
    // Create readable stream for the zip
    const archive = new ZipArchive({
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
        // Append files to archive
        for (const [path, content] of Object.entries(files)) {
          archive.append(content, { name: path });
        }
        // Finalize (start zipping)
        await archive.finalize();
      },
    });
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${dbPackage.name}.zip"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error exporting script", { status: 500 });
  }
};
