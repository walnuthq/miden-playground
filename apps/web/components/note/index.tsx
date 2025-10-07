"use client";
import { useSearchParams } from "next/navigation";
import { useIsClient } from "usehooks-ts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import useNotes from "@/hooks/use-notes";
import NoteInformation from "@/components/note/note-information";
import ConsumeNoteButton from "@/components/note/consume-note-button";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import { noteConsumable } from "@/lib/types/note";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";

const Note = ({ id }: { id: string }) => {
  const isClient = useIsClient();
  const searchParams = useSearchParams();
  const { accountId } = useWallet();
  const { networkId } = useGlobalContext();
  const { wallets } = useAccounts();
  const { inputNotes } = useNotes();
  const inputNote = inputNotes.find((inputNote) => inputNote.id === id);
  if (!isClient || !inputNote) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs defaultValue={searchParams.get("tab") ?? "information"}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="information">Information</TabsTrigger>
          </TabsList>
          {noteConsumable({
            inputNote,
            networkId,
            accountId: wallets.find(({ address }) => address === accountId)?.id,
          }) && <ConsumeNoteButton inputNote={inputNote} />}
        </div>
        <TabsContent value="information">
          <NoteInformation inputNote={inputNote} />
        </TabsContent>
      </Tabs>
      <CreateTransactionDialog />
    </div>
  );
};

export default Note;
