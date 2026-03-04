"use client";
import { useQuery } from "@tanstack/react-query";
import { getVerifiedAccountComponents } from "@/lib/api";
import Account from "@/components/account/account";
import useGlobalContext from "@/components/global-context/hook";

const AccountIndex = ({ identifier }: { identifier: string }) => {
  const { networkId } = useGlobalContext();
  const { data } = useQuery({
    queryKey: ["verifiedAccountComponents", networkId, identifier],
    queryFn: () =>
      getVerifiedAccountComponents({
        networkId,
        identifier,
      }),
  });
  return (
    <Account identifier={identifier} verifiedAccountComponents={data ?? []} />
  );
};

export default AccountIndex;
