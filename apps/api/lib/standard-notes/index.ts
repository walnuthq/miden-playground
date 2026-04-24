import type { Package } from "@/lib/types";
import p2id from "@/lib/standard-notes/p2id";
import p2ide from "@/lib/standard-notes/p2ide";
import swap from "@/lib/standard-notes/swap";
import mint from "@/lib/standard-notes/mint";
import burn from "@/lib/standard-notes/burn";

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
