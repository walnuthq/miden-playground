import { type InputNote, noteInputsToAccountId } from "@/lib/types";
import NoteInformationTable from "@/components/note/note-information-table";
import NoteInputsTable from "@/components/note/note-inputs-table";
import DecodedNoteInputsTable from "@/components/note/decoded-note-inputs-table";
import useGlobalContext from "@/components/global-context/hook";
import AccountAddress from "@/components/lib/account-address";
import FungibleAssetsTable from "@/components/lib/fungible-assets-table";

const NoteInformation = ({ inputNote }: { inputNote: InputNote }) => {
  const { networkId } = useGlobalContext();
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
      {inputNote.wellKnownNote === "P2ID" && (
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
                    address={noteInputsToAccountId(
                      inputNote.inputs
                    ).toBech32Custom(networkId)}
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
