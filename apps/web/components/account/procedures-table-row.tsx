import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
import { TableRow, TableCell } from "@workspace/ui/components/table";
import { type Account } from "@/lib/types/account";
import { type Procedure, getStorageRead } from "@/lib/types/script";
import { type Component } from "@/lib/types/component";
import { Button } from "@workspace/ui/components/button";
import useGlobalContext from "@/components/global-context/hook";
import { clientGetAccountByAddress, webClient } from "@/lib/web-client";
import useScripts from "@/hooks/use-scripts";

const ProceduresTableRow = ({
  account,
  scriptId,
  procedure,
}: {
  account: Account;
  component: Component;
  scriptId: string;
  procedure: Procedure;
}) => {
  const { networkId, serializedMockChain } = useGlobalContext();
  const { openInvokeProcedureArgumentsDialog } = useScripts();
  const { invokeProcedure } = useScripts();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  return (
    <TableRow key={procedure.name}>
      <TableCell>{procedure.name}</TableCell>
      <TableCell className="flex items-center justify-between gap-2">
        <span>{result}</span>
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            if (procedure.readOnly && procedure.storageRead) {
              const client = await webClient(networkId, serializedMockChain);
              const wasmAccount = await clientGetAccountByAddress(
                client,
                account.address
              );
              const word = await getStorageRead(
                wasmAccount,
                procedure.storageRead
              );
              if (word) {
                const [, , , felt] = word.toU64s();
                setResult(felt!.toString());
              }
            } else if (procedure.inputs.length === 0) {
              const transactionRecord = await invokeProcedure({
                senderAccountId: account.id,
                scriptId,
                procedure,
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
                scriptId,
                procedure,
              });
            }
            setLoading(false);
          }}
        >
          {loading && <Spinner />}
          {loading ? "Invoking…" : "Invoke"}
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default ProceduresTableRow;
