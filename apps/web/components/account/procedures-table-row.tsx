import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
import { TableRow, TableCell } from "@workspace/ui/components/table";
import { type Account } from "@/lib/types/account";
import { type Script, type Export } from "@/lib/types/script";
import { type Component } from "@/lib/types/component";
import { Button } from "@workspace/ui/components/button";
import { clientReadWord } from "@/lib/web-client";
import useScripts from "@/hooks/use-scripts";
import CopyButton from "@/components/lib/copy-button";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useWebClient from "@/hooks/use-web-client";

const ProceduresTableRow = ({
  account,
  component,
  script,
  procedureExport,
}: {
  account: Account;
  component: Component;
  script: Script;
  procedureExport: Export;
}) => {
  const { midenSdk } = useMidenSdk();
  const { client } = useWebClient();
  const { openInvokeProcedureArgumentsDialog } = useScripts();
  const { invokeProcedure } = useScripts();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  return (
    <TableRow key={procedureExport.name}>
      <TableCell>
        <div className="flex items-center gap-2">
          {procedureExport.name}
          <CopyButton
            content="Copy Procedure Digest"
            copy={procedureExport.digest}
          />
        </div>
      </TableCell>
      {account.components.includes("no-auth") &&
        component.type === "account" && (
          <TableCell className="flex items-center justify-between gap-2">
            <span>{result}</span>
            <Button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                if (procedureExport.readOnly) {
                  const word = await clientReadWord({
                    client,
                    accountId: account.id,
                    procedureExport,
                    midenSdk,
                  });
                  if (procedureExport.signature.results.length === 1) {
                    const [, , , felt = 0n] = word.toU64s();
                    setResult(felt.toString());
                  } else if (procedureExport.signature.results.length === 4) {
                    setResult(word.toHex());
                  }
                } else if (procedureExport.signature.params.length === 0) {
                  const transactionRecord = await invokeProcedure({
                    senderAccountId: account.id,
                    scriptId: script.id,
                    procedureExport,
                  });
                  toast("Transaction submitted.", {
                    action: {
                      label: "View on MidenScan",
                      onClick: () =>
                        window.open(
                          `https://testnet.midenscan.com/tx/${transactionRecord.id().toHex()}`,
                          "_blank",
                          "noopener noreferrer"
                        ),
                    },
                  });
                } else {
                  openInvokeProcedureArgumentsDialog({
                    senderAccountId: account.id,
                    scriptId: script.id,
                    procedureExport,
                  });
                }
                setLoading(false);
              }}
            >
              {loading && <Spinner />}
              {loading ? "Invoking…" : "Invoke"}
            </Button>
          </TableCell>
        )}
    </TableRow>
  );
};

export default ProceduresTableRow;
