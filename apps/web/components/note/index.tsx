import Note from "@/components/note/note";
import { useVerifiedNoteScript } from "@/hooks/use-note-script";
import useNotes from "@/hooks/use-notes";

const NoteIndex = ({ id }: { id: string }) => {
  const { inputNotes } = useNotes();
  const inputNote = inputNotes.find((inputNote) => inputNote.id === id);
  const verifiedNote = useVerifiedNoteScript(inputNote);
  return <Note id={id} serverNoteScript={verifiedNote} />;
};

export default NoteIndex;
