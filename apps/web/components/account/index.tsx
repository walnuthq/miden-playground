import { getVerifiedAccountComponents } from "@/lib/api";
import Account from "@/components/account/account";

const AccountIndex = async ({ identifier }: { identifier: string }) => {
  const verifiedAccountComponents =
    await getVerifiedAccountComponents(identifier);
  return (
    <Account
      identifier={identifier}
      verifiedAccountComponents={verifiedAccountComponents}
    />
  );
};

export default AccountIndex;
