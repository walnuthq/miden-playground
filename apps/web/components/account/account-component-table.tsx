import { useState } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import useScripts from "@/hooks/use-scripts";
import { type Account } from "@/lib/types/account";
import {
  type Component,
  type StorageSlot,
  type Procedure,
  componentTypes,
  storageSlotTypes,
  getStorageRead,
} from "@/lib/types/component";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@workspace/ui/components/table";
import { formatValue } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import useGlobalContext from "@/components/global-context/hook";
import { clientGetAccountByAddress, webClient } from "@/lib/web-client";
import useTransactions from "@/hooks/use-transactions";
// import useTransactions from "@/hooks/use-transactions";

const StorageSlotsTable = ({
  storage,
  storageSlots,
}: {
  storage: string[];
  storageSlots: StorageSlot[];
}) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {storageSlots.map(({ name, type }, index) => (
          <TableRow key={name}>
            <TableCell>{name}</TableCell>
            <TableCell>{storageSlotTypes[type]}</TableCell>
            <TableCell>{formatValue(storage[index] ?? "")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// const ReadOnlyProceduresTable = ({ account }: { account: Account }) => {
//   const { networkId, serializedMockChain } = useGlobalContext();
//   const { scripts } = useScripts();
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState("");
//   const getCount = async () => {
//     const client = await webClient(networkId, serializedMockChain);
//     const counter = await clientGetAccountByAddress(client, account.address);
//     const count = counter?.storage().getItem(0);
//     const counterValue = BigInt(
//       `0x${count!.toHex().slice(-16).match(/../g)!.reverse().join("")}`
//     );
//     const script = scripts.find(({ id }) => id === "counter-contract");
//     const newCounterValue = counterValue + 1n;
//     setResult(
//       script?.updatedAt === 0
//         ? counterValue.toString()
//         : newCounterValue.toString()
//     );
//   };
//   return (
//     <div className="rounded-md border">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead className="w-[180px]">Name</TableHead>
//             <TableHead>Result</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           <TableRow>
//             <TableCell>get_count</TableCell>
//             <TableCell className="flex items-center justify-between gap-2">
//               <span>{result}</span>
//               <Button
//                 disabled={loading}
//                 onClick={async () => {
//                   setLoading(true);
//                   await getCount();
//                   setLoading(false);
//                 }}
//               >
//                 {loading && <RotateCw className="animate-spin" />}
//                 {loading ? "Calling…" : "Call"}
//               </Button>
//             </TableCell>
//           </TableRow>
//         </TableBody>
//       </Table>
//     </div>
//   );
// };

const invokeProcedureCustomTransactionScript = (
  contractName: string,
  procedureName: string
) => `use.external_contract::${contractName}
begin
    call.${contractName}::${procedureName}
end
`;

const ProcedureItem = ({
  account,
  component,
  procedure,
}: {
  account: Account;
  component: Component;
  procedure: Procedure;
}) => {
  const { networkId, serializedMockChain } = useGlobalContext();
  const { scripts } = useScripts();
  const { newCustomTransactionRequest, submitTransaction } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const invokeProcedure = async () => {
    const script = scripts.find(({ id }) => id === component.scriptId);
    if (!script) {
      return;
    }
    const {
      TransactionKernel: WasmTransactionKernel,
      AssemblerUtils: WasmAssemblerUtils,
      TransactionScript: WasmTransactionScript,
      TransactionRequestBuilder: WasmTransactionRequestBuilder,
    } = await import("@demox-labs/miden-sdk");
    const assembler = WasmTransactionKernel.assembler();
    const contractName = script.id.replaceAll("-", "_");
    const accountComponentLibrary =
      WasmAssemblerUtils.createAccountComponentLibrary(
        assembler,
        `external_contract::${contractName}`,
        script.masm
      );
    const transactionScript = WasmTransactionScript.compile(
      invokeProcedureCustomTransactionScript(contractName, procedure.name),
      assembler.withLibrary(accountComponentLibrary)
    );
    const transactionRequest = new WasmTransactionRequestBuilder()
      .withCustomScript(transactionScript)
      .build();
    const transactionResult = await newCustomTransactionRequest({
      senderAccountId: account.id,
      transactionRequest,
    });
    /*const transactionRecord = */ await submitTransaction(transactionResult);
    // console.log(transactionRecord.id().toHex());
    // const client = await webClient(networkId, serializedMockChain);
    // const counter = await clientGetAccountByAddress(client, account.address);
    // const count = counter?.storage().getItem(0);
    // TODO remove mock
    // const counterValue =
    //   BigInt(
    //     `0x${count!.toHex().slice(-16).match(/../g)!.reverse().join("")}`
    //   ) + 1n;
    // await sleep(2000);
    // const script = scripts.find(({ id }) => id === "counter-contract")!;
    // updateScript({ ...script, updatedAt: 1 });
    // setResult(counterValue.toString());
  };
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
              // await sleep(1000);
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
                const felt = BigInt(
                  `0x${word!.toHex().slice(-16).match(/../g)!.reverse().join("")}`
                );
                setResult(felt.toString());
              }
            } else {
              await invokeProcedure();
            }
            setLoading(false);
          }}
        >
          {loading && <RotateCw className="animate-spin" />}
          {loading ? "Invoking…" : "Invoke"}
        </Button>
      </TableCell>
    </TableRow>
  );
};

const ProceduresTable = ({
  account,
  component,
}: {
  account: Account;
  component: Component;
}) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Name</TableHead>
          <TableHead>Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {component.procedures.map((procedure) => (
          <ProcedureItem
            key={procedure.name}
            account={account}
            component={component}
            procedure={procedure}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);

const AccountComponentTable = ({
  account,
  component,
}: {
  account: Account;
  component: Component;
}) => {
  const { scripts } = useScripts();
  const script = scripts.find(({ id }) => id === component.scriptId);
  return (
    <div className="rounded-md border">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>{componentTypes[component.type]}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Script</TableCell>
            <TableCell>
              <Link
                className="text-primary font-medium underline underline-offset-4"
                href={`/scripts/${component.scriptId}`}
              >
                {script?.name}
              </Link>
            </TableCell>
          </TableRow>
          {component.storageSlots.length > 0 && (
            <TableRow>
              <TableCell>Storage Slots</TableCell>
              <TableCell>
                <StorageSlotsTable
                  storage={account.storage}
                  storageSlots={component.storageSlots}
                />
              </TableCell>
            </TableRow>
          )}
          {component.procedures.length > 0 && (
            <TableRow>
              <TableCell>Procedures</TableCell>
              <TableCell>
                <ProceduresTable account={account} component={component} />
              </TableCell>
            </TableRow>
          )}
          {/*component.id === "counter-contract" && (
            <TableRow>
              <TableCell>Read-only Procedures</TableCell>
              <TableCell>
                <ReadOnlyProceduresTable account={account} />
              </TableCell>
            </TableRow>
          )*/}
          {/*component.id === "counter-contract" && (
            <TableRow>
              <TableCell>Read-write Procedures</TableCell>
              <TableCell>
                <ReadWriteProceduresTable account={account} />
              </TableCell>
            </TableRow>
          )*/}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountComponentTable;
