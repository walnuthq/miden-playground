import { useParams } from "react-router";
import Transaction from "@/components/transaction";

const TransactionPage = () => {
  const { id = "" } = useParams();
  return <Transaction id={id} />;
};

export default TransactionPage;
