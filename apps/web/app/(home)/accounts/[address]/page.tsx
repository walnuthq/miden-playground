import Account from "@/components/account";

const AccountPage = async ({
  params,
}: {
  params: Promise<{ address: string }>;
}) => {
  const { address } = await params;
  return <Account address={address} />;
};

export default AccountPage;
