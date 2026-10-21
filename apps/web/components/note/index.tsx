"use client";
import { useQuery } from "@tanstack/react-query";
import Note from "@/components/note/note";
import useNetwork from "@/hooks/use-network";
import useNotes from "@/hooks/use-notes";
import { getVerifiedNote } from "@/lib/api";
import { isValidUUIDv4 } from "@/lib/utils";

const NoteIndex = ({ id }: { id: string }) => {
  const { networkId } = useNetwork();
  const { inputNotes } = useNotes();
  const inputNote = inputNotes.find((inputNote) => inputNote.id === id);
  const scriptRoot = inputNote?.scriptRoot ?? "";
  const scriptId = inputNote?.scriptId ?? "";
  const isStandardNote = ["p2id", "p2ide"].includes(scriptId);
  const { data } = useQuery({
    queryKey: ["verifiedNote", networkId, scriptRoot],
    queryFn: () =>
      getVerifiedNote({
        networkId,
        script: scriptRoot,
      }),
    enabled:
      ["mtst", "mdev"].includes(networkId) &&
      !isStandardNote &&
      scriptRoot !== "",
  });
  const rawVerifiedNote = data?.noteScript ?? null;
  const verifiedNote = isValidUUIDv4(rawVerifiedNote?.id ?? "")
    ? rawVerifiedNote
    : null;
  return <Note id={id} serverNoteScript={verifiedNote} />;
};

export default NoteIndex;
