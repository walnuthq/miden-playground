import { type Package } from "@/lib/types";
import p2id from "@/lib/default-note-scripts/p2id";
import p2ide from "@/lib/default-note-scripts/p2ide";
import swap from "@/lib/default-note-scripts/swap";
import mint from "@/lib/default-note-scripts/mint";
import burn from "@/lib/default-note-scripts/burn";

export const getStandardNoteScript = (noteScript: string): Package | null => {
  switch (noteScript) {
    case "P2ID": {
      return p2id;
    }
    case "P2IDE": {
      return p2ide;
    }
    case "SWAP": {
      return swap;
    }
    case "MINT": {
      return mint;
    }
    case "BURN": {
      return burn;
    }
    default: {
      return null;
    }
  }
};
