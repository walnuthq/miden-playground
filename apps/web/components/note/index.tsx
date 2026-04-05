"use client";
import { useQuery } from "@tanstack/react-query";
import Note from "@/components/note/note";
import useGlobalContext from "@/components/global-context/hook";
import { getVerifiedNote } from "@/lib/api";
import { isValidUUIDv4 } from "@/lib/utils";

const NoteIndex = ({ id }: { id: string }) => {
  const { networkId } = useGlobalContext();
  const { data } = useQuery({
    queryKey: ["verifiedNote", networkId, id],
    queryFn: () =>
      getVerifiedNote({
        networkId,
        noteId: id,
      }),
    enabled: ["mtst", "mdev"].includes(networkId),
  });
  const rawVerifiedNote = data?.noteScript ?? null;
  const verifiedNote = isValidUUIDv4(rawVerifiedNote?.id ?? "")
    ? rawVerifiedNote
    : null;
  return <Note id={id} serverNoteScript={verifiedNote} />;
};

export default NoteIndex;
