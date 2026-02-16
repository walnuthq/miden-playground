import { execFile } from "@/lib/utils";

export const midenVerifier = async ({
  type,
  resource,
  masp,
}: {
  type: "account-component" | "note" | "transaction";
  resource: string;
  masp: string;
}) => {
  try {
    await execFile("miden-verifier", [type, resource, masp]);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
