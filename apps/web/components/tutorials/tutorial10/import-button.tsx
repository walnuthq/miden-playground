import { useState } from "react";
import { Download } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import useAccounts from "@/hooks/use-accounts";
import { Button } from "@workspace/ui/components/button";
import noAuth from "@/lib/types/default-components/no-auth";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";

const ImportButton = () => {
  const { accounts, deployAccount } = useAccounts();
  const { components } = useComponents();
  const [loading, setLoading] = useState(false);
  const counterContractComponent = components.find(
    ({ id, type }) => !defaultComponentIds.includes(id) && type === "account"
  );
  const counter = accounts.find(({ components }) => components.length === 0);
  return (
    <Button
      disabled={loading || !!counter}
      onClick={async () => {
        if (!counterContractComponent) {
          return;
        }
        setLoading(true);
        await deployAccount({
          name: "Unverified Contract",
          accountType: "regular-account-immutable-code",
          storageMode: "public",
          components: [noAuth, counterContractComponent],
          verify: false,
        });
        setLoading(false);
      }}
    >
      {loading ? <Spinner /> : <Download />}
      {loading ? "Importing…" : "Import"}
    </Button>
  );
};

export default ImportButton;
