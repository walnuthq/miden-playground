import { type InputNote } from "@/lib/types/note";
import { accountIdFromPrefixSuffix } from "@/lib/utils/account";
import NoteInformationTable from "@/components/note/note-information-table";
import NoteInputsTable from "@/components/note/note-inputs-table";
import DecodedNoteStorageTable from "@/components/note/decoded-note-storage-table";
import AccountAddress from "@/components/lib/account-address";
import FungibleAssetsTable from "@/components/lib/fungible-assets-table";
import useScripts from "@/hooks/use-scripts";
import type { Script } from "@/lib/types/script";

const NoteInformation = ({
  inputNote,
  serverNoteScript,
}: {
  inputNote: InputNote;
  serverNoteScript: Script | null;
}) => {
  const { scripts } = useScripts();
  const script =
    scripts.find(({ id }) => id === inputNote.scriptId) ?? serverNoteScript;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Note Information
        </h4>
        <NoteInformationTable inputNote={inputNote} script={script} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          <div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Note Assets
            </h4>
            {inputNote.fungibleAssets.length === 0 && (
              <p className="text-muted-foreground text-sm">
                This note has no assets.
              </p>
            )}
          </div>
        </div>
        {inputNote.fungibleAssets.length > 0 && (
          <FungibleAssetsTable fungibleAssets={inputNote.fungibleAssets} />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          <div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Raw Note Storage
            </h4>
            {inputNote.fungibleAssets.length === 0 && (
              <p className="text-muted-foreground text-sm">
                This note has no storage.
              </p>
            )}
          </div>
        </div>
        {inputNote.storage.length > 0 && (
          <NoteInputsTable inputs={inputNote.storage} />
        )}
      </div>
      {/* TODO: better decoded note storage using inputNote.scriptId */}
      {script?.id === "p2id" && (
        <div className="flex flex-col gap-2">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Decoded Note Storage
          </h4>
          <DecodedNoteStorageTable
            inputs={[
              {
                key: "Target Account ID",
                value: (
                  <AccountAddress
                    id={accountIdFromPrefixSuffix(
                      inputNote.storage[1]!,
                      inputNote.storage[0]!,
                    )}
                  />
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default NoteInformation;
