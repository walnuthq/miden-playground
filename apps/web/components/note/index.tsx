"use client";
import { useQuery } from "@tanstack/react-query";
import Note from "@/components/note/note";
import useNetwork from "@/hooks/use-network";
import { getVerifiedNote } from "@/lib/api";
import { isValidUUIDv4 } from "@/lib/utils";
import useNotes from "@/hooks/use-notes";

const NoteIndex = ({ id }: { id: string }) => {
  const { networkId } = useNetwork();
  const { inputNotes } = useNotes();
  const inputNote = inputNotes.find((inputNote) => inputNote.id === id);
  const scriptId = inputNote?.scriptId ?? "";
  const isStandardNote = ["p2id", "p2ide"].includes(scriptId);
  const { data } = useQuery({
    queryKey: ["verifiedNote", networkId, id],
    queryFn: () =>
      getVerifiedNote({
        networkId,
        noteId: id,
      }),
    enabled: ["mtst", "mdev"].includes(networkId) && !isStandardNote,
  });
  const rawVerifiedNote = data?.noteScript ?? null;
  const verifiedNote = isValidUUIDv4(rawVerifiedNote?.id ?? "")
    ? rawVerifiedNote
    : null;
  return <Note id={id} serverNoteScript={verifiedNote} />;
};

export default NoteIndex;
