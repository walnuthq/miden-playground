import Account from "@/components/account";

const AccountPage = async ({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) => {
  const { identifier } = await params;
  return <Account identifier={identifier} />;
};

export default AccountPage;
