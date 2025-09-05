import { useState } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import useScripts from "@/hooks/use-scripts";
import {
  type Account,
  type Component,
  type StorageSlot,
  componentTypes,
  storageSlotTypes,
} from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@workspace/ui/components/table";
import { formatValue, sleep } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import useGlobalContext from "@/components/global-context/hook";
import { webClient } from "@/lib/web-client";
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

const ReadOnlyProceduresTable = ({ account }: { account: Account }) => {
  const { networkId } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const getCount = async () => {
    const client = await webClient(networkId);
    const { AccountId: WasmAccountId } = await import("@demox-labs/miden-sdk");
    const counter = await client.getAccount(
      // @ts-ignore
      WasmAccountId.fromBech32(account.address)
    );
    const count = counter?.storage().getItem(0);
    const counterValue = BigInt(
      `0x${count!.toHex().slice(-16).match(/../g)!.reverse().join("")}`
    );
    setResult(counterValue.toString());
  };
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>get_count</TableCell>
            <TableCell className="flex items-center justify-between gap-2">
              <span>{result}</span>
              <Button
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  await getCount();
                  setLoading(false);
                }}
              >
                {loading && <RotateCw className="animate-spin" />}
                {loading ? "Calling…" : "Call"}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

const counterContractCode = `use.miden::account
use.std::sys

# => []
export.get_count
    push.0
    # => [index]

    # exec.account::get_item
    # => [count]

    # exec.sys::truncate_stack
    # => []
end

# => []
export.increment_count
    push.0
    # => [index]

    exec.account::get_item
    # => [count]

    push.1 add
    # => [count+1]

    # debug statement with client
    debug.stack

    push.0
    # [index, count+1]

    exec.account::set_item
    # => []

    push.1 exec.account::incr_nonce
    # => []

    exec.sys::truncate_stack
    # => []
end
`;

const txScriptCode = `use.external_contract::counter_contract
begin
    call.counter_contract::increment_count
end
`;

const ReadWriteProceduresTable = ({ account }: { account: Account }) => {
  const { networkId } = useGlobalContext();
  // const { newCustomTransactionRequest, submitTransaction } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const incrementCount = async () => {
    const {
      // TransactionKernel,
      // AssemblerUtils,
      // TransactionScript,
      // TransactionRequestBuilder,
      AccountId: WasmAccountId,
    } = await import("@demox-labs/miden-sdk");
    // const assembler = TransactionKernel.assembler();
    // let counterComponentLib = AssemblerUtils.createAccountComponentLibrary(
    //   assembler, // assembler
    //   "external_contract::counter_contract", // library path to call the contract
    //   counterContractCode // account code of the contract
    // );
    // const txScript = TransactionScript.compile(
    //   txScriptCode,
    //   assembler.withLibrary(counterComponentLib)
    // );
    // const transactionRequest = new TransactionRequestBuilder()
    //   .withCustomScript(txScript)
    //   .build();
    // const transactionResult = await newCustomTransactionRequest({
    //   senderAccountId: AccountId.fromBech32(COUNTER_CONTRACT_ID).toString(),
    //   // @ts-ignore
    //   transactionRequest,
    // });
    // const transactionRecord = await submitTransaction(transactionResult);
    // console.log(transactionRecord.id().toHex());
    const client = await webClient(networkId);
    const counter = await client.getAccount(
      // @ts-ignore
      WasmAccountId.fromBech32(account.address)
    );
    const count = counter?.storage().getItem(0);
    // TODO remove mock
    const counterValue =
      BigInt(
        `0x${count!.toHex().slice(-16).match(/../g)!.reverse().join("")}`
      ) + 1n;
    await sleep(2000);
    setResult(counterValue.toString());
  };
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>increment_count</TableCell>
            <TableCell className="flex items-center justify-between gap-2">
              <span>{result}</span>
              <Button
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  await incrementCount();
                  setLoading(false);
                }}
              >
                {loading && <RotateCw className="animate-spin" />}
                {loading ? "Invoking…" : "Invoke"}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

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
          {component.id === "counter-contract" && (
            <TableRow>
              <TableCell>Read-only Procedures</TableCell>
              <TableCell>
                <ReadOnlyProceduresTable account={account} />
              </TableCell>
            </TableRow>
          )}
          {component.id === "counter-contract" && (
            <TableRow>
              <TableCell>Read-write Procedures</TableCell>
              <TableCell>
                <ReadWriteProceduresTable account={account} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountComponentTable;
