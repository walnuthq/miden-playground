import { toast } from "sonner";
import type { Script } from "@/lib/types/script";

// The link to a script's page, which anyone can open: they get it read-only,
// with Fork (hooks/use-script.ts).
export const scriptLink = (id: string) =>
  `${window.location.origin}/scripts/${id}`;

// What a link gives, said each time one is copied. The API serves what it
// stored at the last compile, not the editor's text.
export const shareDescription = ({ status }: Pick<Script, "status">) =>
  `Anyone with the link can read this script and its dependencies, including your later changes, until you delete it.${status === "draft" ? " It shows the last compiled version: compile to share your latest changes." : ""}`;

// Copies a script's link, with a toast that says what it gives.
export const shareScript = async (script: Pick<Script, "id" | "status">) => {
  const link = scriptLink(script.id);
  try {
    await navigator.clipboard.writeText(link);
  } catch (error) {
    console.error("ERROR: shareScript", error);
    toast.error("The link couldn't be copied.", { description: link });
    return;
  }
  toast.success("Link copied.", { description: shareDescription(script) });
};
