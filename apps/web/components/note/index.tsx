"use client";
import { useQuery } from "@tanstack/react-query";
import Note from "@/components/note/note";
import useGlobalContext from "@/components/global-context/hook";
import { getVerifiedNote } from "@/lib/api";

const NoteIndex = ({ id }: { id: string }) => {
  const { networkId } = useGlobalContext();
  const { data } = useQuery({
    queryKey: ["verifiednote", networkId, id],
    queryFn: () =>
      getVerifiedNote({
        networkId,
        noteId: id,
      }),
  });
  return <Note id={id} serverNoteScript={data ?? null} />;
};

export default NoteIndex;
