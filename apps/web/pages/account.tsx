import { useParams } from "react-router";
import Account from "@/components/account";

const AccountPage = () => {
  const { identifier = "" } = useParams();
  return <Account identifier={identifier} />;
};

export default AccountPage;
