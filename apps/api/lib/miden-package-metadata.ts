import { execFile } from "@/lib/utils";
import { projectRoot } from "@/lib/constants";

export const midenPackageMetadata = async (maspPath: string) => {
  const { stdout } = await execFile(
    process.env.NODE_ENV === "production"
      ? "miden-package-metadata"
      : "./miden-package-metadata",
    [maspPath],
    {
      cwd:
        process.env.NODE_ENV === "production"
          ? undefined
          : `${projectRoot}/miden-package-metadata/target/release`,
    }
  );
  return stdout;
};
