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
import NoteCode from "@/components/note/note-code";
import ConsumeNoteButton from "@/components/note/consume-note-button";
import CreateTransactionDialog from "@/components/transactions/create-transaction-dialog";
import { noteWellKnownNote, noteConsumed } from "@/lib/types";

const Note = ({ id }: { id: string }) => {
  const isClient = useIsClient();
  const searchParams = useSearchParams();
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
            {noteWellKnownNote(inputNote.inputNote) === "P2ID" && (
              <TabsTrigger value="code">Code</TabsTrigger>
            )}
          </TabsList>
          {noteWellKnownNote(inputNote.inputNote) === "P2ID" &&
            !noteConsumed(inputNote.inputNote) && (
              <ConsumeNoteButton inputNote={inputNote} />
            )}
        </div>
        <TabsContent value="information">
          <NoteInformation inputNote={inputNote} />
        </TabsContent>
        <TabsContent value="code">
          <NoteCode />
        </TabsContent>
      </Tabs>
      <CreateTransactionDialog />
    </div>
  );
};

export default Note;
