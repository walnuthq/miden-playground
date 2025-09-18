import { type Script } from "@/lib/types/script";
import Editor from "@/components/lib/editor";

const NoteScript = ({ script }: { script: Script }) => (
  <Editor script={script} language="rust" readOnly height="85vh" />
);

export default NoteScript;
