import { type InputNote } from "@/lib/types/note";
import { accountIdFromPrefixSuffix } from "@/lib/types/account";
import NoteInformationTable from "@/components/note/note-information-table";
import NoteInputsTable from "@/components/note/note-inputs-table";
import DecodedNoteInputsTable from "@/components/note/decoded-note-inputs-table";
import AccountAddress from "@/components/lib/account-address";
import FungibleAssetsTable from "@/components/lib/fungible-assets-table";
import useScripts from "@/hooks/use-scripts";

const NoteInformation = ({ inputNote }: { inputNote: InputNote }) => {
  const { scripts } = useScripts();
  const script = scripts.find(({ root }) => root === inputNote.scriptRoot);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Note Information
        </h4>
        <NoteInformationTable inputNote={inputNote} />
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Note Assets
        </h4>
        <FungibleAssetsTable fungibleAssets={inputNote.fungibleAssets} />
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Raw Note Inputs
        </h4>
        <NoteInputsTable inputs={inputNote.inputs} />
      </div>
      {script?.id === "p2id" && (
        <div className="flex flex-col gap-2">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Decoded Note Inputs
          </h4>
          <DecodedNoteInputsTable
            inputs={[
              {
                key: "Target Account ID",
                value: (
                  <AccountAddress
                    id={accountIdFromPrefixSuffix(
                      inputNote.inputs[1]!,
                      inputNote.inputs[0]!
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
