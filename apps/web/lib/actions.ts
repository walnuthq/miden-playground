"use server";
import { refresh } from "next/cache";

export const verifyAccountComponentFromSource = async ({
  accountId,
  address,
  account,
  cargoToml,
  rust,
}: {
  accountId: string;
  address: string;
  account: string;
  cargoToml: string;
  rust: string;
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/verified-account-components`, {
    method: "POST",
    body: JSON.stringify({
      accountId,
      address,
      account,
      cargoToml,
      rust,
    }),
  });
  refresh();
  const result = await response.json();
  const { ok, error } = result as { ok: boolean; error?: string };
  return { verified: ok, error };
};
