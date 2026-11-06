import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";
import noAuth from "@/lib/types/default-components/auth-no-auth";

const ImportButton = () => {
  const { accounts, deployAccount } = useAccounts();
  const { components } = useComponents();
  const [loading, setLoading] = useState(false);
  const counterContractComponent = components.find(
    ({ id, type }) =>
      !defaultComponentIds.includes(id) && type === "account-component",
  );
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  return (
    <Button
      disabled={loading || !!counter}
      onClick={async () => {
        if (!counterContractComponent) {
          return;
        }
        setLoading(true);
        try {
          await deployAccount({
            name: "Unverified Contract",
            storageMode: "public",
            components: [noAuth, counterContractComponent],
            verify: false,
          });
        } catch (error) {
          console.error(error);
          toast.error("Failed to import the contract.", {
            description: error instanceof Error ? error.message : String(error),
          });
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Spinner /> : <Download />}
      {loading ? "Importing…" : "Import"}
    </Button>
  );
};

export default ImportButton;
