import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { deployableAccountComponents } from "@/lib/utils/account-components";
import { schemaStorageSlots } from "@/lib/utils/storage-schema";

const ImportButton = () => {
  const { accounts, deployAccount } = useAccounts();
  const { scripts } = useScripts();
  const [loading, setLoading] = useState(false);
  // The counter the user compiled in step 2.
  const [counterScript] = deployableAccountComponents(scripts);
  const counter = accounts.find(({ name }) => name === "Unverified Contract");
  return (
    <Button
      disabled={loading || !!counter}
      onClick={async () => {
        if (!counterScript) {
          return;
        }
        setLoading(true);
        try {
          await deployAccount({
            name: "Unverified Contract",
            storageMode: "public",
            components: [
              { scriptId: "auth-no-auth", storageSlots: [] },
              {
                scriptId: counterScript.id,
                storageSlots: counterScript.metadata?.storage
                  ? schemaStorageSlots(counterScript.metadata.storage)
                  : [],
              },
            ],
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
