"use server";
import { refresh } from "next/cache";

export const verifyAccountComponentFromSource = async ({
  accountId,
  identifier,
  account,
  cargoToml,
  rust,
}: {
  accountId: string;
  identifier: string;
  account: string;
  cargoToml: string;
  rust: string;
}) => {
  // const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_API_URL
      : "https://miden-playground-api.walnut.dev";
  const response = await fetch(`${apiUrl}/verified-account-components`, {
    method: "POST",
    body: JSON.stringify({
      accountId,
      identifier,
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
