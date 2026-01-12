import { getVerifiedAccountComponents } from "@/lib/api";
import Account from "@/components/account/account";
import { getAddressPart } from "@/lib/utils";

const AccountIndex = async ({ address }: { address: string }) => {
  const verifiedAccountComponents = await getVerifiedAccountComponents(
    getAddressPart(address)
  );
  return (
    <Account
      address={address}
      verifiedAccountComponents={verifiedAccountComponents}
    />
  );
};

export default AccountIndex;
