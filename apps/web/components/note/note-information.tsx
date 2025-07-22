import { NetworkId } from "@workspace/mock-web-client";
import {
  noteWellKnownNote,
  type InputNote,
  noteInputsToAccountId,
} from "@/lib/types";
import NoteInformationTable from "@/components/note/note-information-table";
import NoteInputsTable from "@/components/note/note-inputs-table";
import DecodedNoteInputsTable from "@/components/note/decoded-note-inputs-table";
import useGlobalContext from "@/components/global-context/hook";
import AccountAddress from "@/components/lib/account-address";
import FungibleAssetsTable from "../lib/fungible-assets-table";

const NoteInformation = ({ inputNote }: { inputNote: InputNote }) => {
  const { networkId } = useGlobalContext();
  const wellKnownNote = noteWellKnownNote(inputNote.inputNote);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Note Information
        </h4>
        <NoteInformationTable inputNote={inputNote.inputNote} />
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Note Assets
        </h4>
        <FungibleAssetsTable
          fungibleAssets={inputNote.inputNote
            .details()
            .assets()
            .fungibleAssets()
            .map((fungibleAsset) => ({
              faucetId: fungibleAsset.faucetId().toString(),
              amount: fungibleAsset.amount().toString(),
            }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Note Inputs
        </h4>
        <NoteInputsTable
          inputs={inputNote.inputNote.details().recipient().inputs()}
        />
      </div>
      {wellKnownNote === "P2ID" && (
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
                      inputNote.inputNote.details().recipient().inputs()
                    ).toBech32(NetworkId.tryFromStr(networkId))}
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
