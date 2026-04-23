"use client";
import { useQuery } from "@tanstack/react-query";
import { getVerifiedAccountComponents } from "@/lib/api";
import Account from "@/components/account/account";
import { isValidUUIDv4 } from "@/lib/utils";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";

const AccountIndex = ({ identifier }: { identifier: string }) => {
  const { networkId } = useNetwork();
  const { accounts } = useAccounts();
  const account = accounts.find((account) => account.identifier === identifier);
  const components = account?.components ?? [];
  const hasStandardComponent = components.some((component) =>
    ["basic-wallet", "basic-fungible-faucet"].includes(component),
  );
  const { data } = useQuery({
    queryKey: ["verifiedAccountComponents", networkId, identifier],
    queryFn: () =>
      getVerifiedAccountComponents({
        networkId,
        identifier,
      }),
    enabled: ["mtst", "mdev"].includes(networkId) && !hasStandardComponent,
  });
  const rawVerifiedAccountComponents = data?.components ?? [];
  const verifiedAccountComponents = rawVerifiedAccountComponents.filter(
    ({ id }) => isValidUUIDv4(id),
  );
  return (
    <Account
      identifier={identifier}
      verifiedAccountComponents={verifiedAccountComponents}
    />
  );
};

export default AccountIndex;
