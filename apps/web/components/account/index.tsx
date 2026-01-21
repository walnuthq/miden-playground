import { getVerifiedAccountComponents } from "@/lib/api";
import Account from "@/components/account/account";
import { getAddressPart } from "@/lib/utils";

const AccountIndex = async ({ address }: { address: string }) => {
  const addressPart = getAddressPart(address);
  const verifiedAccountComponents =
    await getVerifiedAccountComponents(addressPart);
  return (
    <Account
      addressPart={addressPart}
      verifiedAccountComponents={verifiedAccountComponents}
    />
  );
};

export default AccountIndex;
