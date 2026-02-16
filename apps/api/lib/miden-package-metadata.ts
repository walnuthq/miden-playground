import { execFile } from "@/lib/utils";

export const midenPackageMetadata = async (maspPath: string) => {
  const { stdout } = await execFile("miden-package-metadata", [maspPath]);
  return stdout;
};
