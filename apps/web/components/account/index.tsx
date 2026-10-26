import { useQuery } from "@tanstack/react-query";
import Account from "@/components/account/account";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import { getVerifiedAccountComponents } from "@/lib/api";
import { isValidUUIDv4 } from "@/lib/utils";

const AccountIndex = ({ identifier }: { identifier: string }) => {
  const { networkId } = useNetwork();
  const { accounts } = useAccounts();
  const account = accounts.find((account) => account.identifier === identifier);
  const accountCode = account?.code ?? "";
  const { data } = useQuery({
    queryKey: ["verifiedAccountComponents", networkId, accountCode],
    queryFn: () =>
      getVerifiedAccountComponents({
        networkId,
        code: accountCode,
      }),
    enabled: ["mtst", "mdev"].includes(networkId) && accountCode !== "",
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
