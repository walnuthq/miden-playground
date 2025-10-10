import Transaction from "@/components/transaction";

const TransactionPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  return <Transaction id={id} />;
};

export default TransactionPage;
