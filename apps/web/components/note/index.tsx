import Note from "@/components/note/note";
import { getVerifiedNote } from "@/lib/api";

const NoteIndex = async ({ id }: { id: string }) => {
  const noteScript = await getVerifiedNote(id);
  return <Note id={id} serverNoteScript={noteScript} />;
};

export default NoteIndex;
