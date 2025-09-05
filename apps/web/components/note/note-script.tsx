import { type WellKnownNote } from "@/lib/types";
import Editor from "@/components/lib/editor";
import useScripts from "@/hooks/use-scripts";

const NoteScript = ({ wellKnownNote }: { wellKnownNote: WellKnownNote }) => {
  const { scripts } = useScripts();
  const wellKnownNotes = { P2ID: "p2id", P2IDE: "p2ide", SWAP: "swap" };
  const script = scripts.find(({ id }) => id === wellKnownNotes[wellKnownNote]);
  if (!script) {
    return null;
  }
  return <Editor script={script} language="rust" readOnly height="85vh" />;
};

export default NoteScript;
