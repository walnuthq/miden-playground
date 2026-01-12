"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { type Script } from "@/lib/types/script";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";
import VerifyNoteScriptDialog from "@/components/note/verify-note-script-dialog";

const Note = ({
  id,
  serverNoteScript,
}: {
  id: string;
  serverNoteScript: Script | null;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isClient = useIsClient();
  const { networkId } = useGlobalContext();
  const { connectedWallet } = useAccounts();
  const { inputNotes } = useNotes();
  const inputNote = inputNotes.find((inputNote) => inputNote.id === id);
  if (!isClient || !inputNote) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs
        defaultValue={searchParams.get("tab") ?? "information"}
        onValueChange={(value) =>
          router.push(
            value === "information"
              ? pathname
              : `${pathname}?${new URLSearchParams({ tab: value })}`
          )
        }
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="information">Information</TabsTrigger>
          </TabsList>
          {noteConsumable({
            inputNote,
            networkId,
            accountId: connectedWallet?.id,
          }) && <ConsumeNoteButton inputNote={inputNote} />}
        </div>
        <TabsContent value="information">
          <NoteInformation
            inputNote={inputNote}
            serverNoteScript={serverNoteScript}
          />
        </TabsContent>
      </Tabs>
      <CreateTransactionDialog />
      <VerifyNoteScriptDialog />
    </div>
  );
};

export default Note;
