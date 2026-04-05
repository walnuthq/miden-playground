"use client";
import { useQuery } from "@tanstack/react-query";
import { getVerifiedAccountComponents } from "@/lib/api";
import Account from "@/components/account/account";
import useGlobalContext from "@/components/global-context/hook";
import { isValidUUIDv4 } from "@/lib/utils";

const AccountIndex = ({ identifier }: { identifier: string }) => {
  const { networkId } = useGlobalContext();
  const { data } = useQuery({
    queryKey: ["verifiedAccountComponents", networkId, identifier],
    queryFn: () =>
      getVerifiedAccountComponents({
        networkId,
        identifier,
      }),
    enabled: ["mtst", "mdev"].includes(networkId),
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
