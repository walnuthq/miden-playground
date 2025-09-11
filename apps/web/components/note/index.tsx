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
import useScripts from "@/hooks/use-scripts";
import NoteInformation from "@/components/note/note-information";
import NoteScript from "@/components/note/note-script";
import ConsumeNoteButton from "@/components/note/consume-note-button";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import { noteConsumed } from "@/lib/types";

const Note = ({ id }: { id: string }) => {
  const isClient = useIsClient();
  const searchParams = useSearchParams();
  const { inputNotes } = useNotes();
  const { scripts } = useScripts();
  const inputNote = inputNotes.find((inputNote) => inputNote.id === id);
  if (!isClient || !inputNote) {
    return null;
  }
  const script = scripts.find(({ root }) => root === inputNote.scriptRoot);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs defaultValue={searchParams.get("tab") ?? "information"}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="information">Information</TabsTrigger>
            {script && <TabsTrigger value="script">Script</TabsTrigger>}
          </TabsList>
          {script && !noteConsumed(inputNote) && (
            <ConsumeNoteButton inputNote={inputNote} />
          )}
        </div>
        <TabsContent value="information">
          <NoteInformation inputNote={inputNote} />
        </TabsContent>
        {script && (
          <TabsContent value="script">
            <NoteScript script={script} />
          </TabsContent>
        )}
      </Tabs>
      <CreateTransactionDialog />
    </div>
  );
};

export default Note;
