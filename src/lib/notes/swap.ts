import { AccountId, Asset } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { createNoteData, createSwapNotes, generateNoteTag } from '@/lib/miden-wasm-api';
import { Note } from '@/lib/notes';
import { EditorFiles } from '../files';
import json5 from 'json5';
import { DEFAULT_FAUCET_IDS } from '../consts/defaults';

export function createSwapNote({
	senderId,
	receiverId,
	offeredAsset,
	requestedAsset,
	name,
	senderScript
}: {
	senderId: AccountId;
	receiverId: AccountId;
	offeredAsset: Asset;
	requestedAsset: Asset;
	name: string;
	senderScript: string;
}): {
	note: Note;
	newFiles: EditorFiles;
	paybackNote: Note;
} {
	const noteId = generateId();
	const scriptFileId = generateId();
	const inputFileId = generateId();
	const metadataFileId = generateId();
	const vaultFileId = generateId();
	const tag = generateNoteTag(senderId.id);
	const { swapNoteInputs, paybackNote: paybackNoteData } = createSwapNotes(
		senderId.id,
		receiverId.id,
		requestedAsset
	);
	const inputs: string[] = [];
	for (const input of swapNoteInputs) {
		inputs.push(input.toString());
	}

	const paybackNoteId = generateId();
	const paybackScriptFileId = generateId();
	const paybackInputFileId = generateId();
	const paybackMetadataFileId = generateId();
	const paybackVaultFileId = generateId();

	const inputsString = json5.stringify(inputs, null, 2);
	const inputsLines = inputsString.split('\n');

	inputsLines[1] += ' // Payback recipient digest (next 4 values)';
	inputsLines[5] += ' // Requested asset (next 4 values)';
	inputsLines[9] += ' //  Payback note tag';
	inputsLines[10] += ' // Note execution hint (always)';

	const inputsWithComments = inputsLines.join('\n');

	const paybackInputs = [receiverId.suffix, receiverId.prefix];
	const paybackInputsString = json5.stringify(
		paybackInputs.map((input) => input.toString()),
		null,
		2
	);
	const paybackInputsWithComments = paybackInputsString
		.replace(',\n', ', // Receiver account id suffix\n')
		.replace(',\n', ', // Receiver account id prefix\n');

	const newFiles: EditorFiles = {
		[scriptFileId]: {
			id: scriptFileId,
			name: `Script`,
			content: { value: SWAP_SCRIPT },
			isOpen: false,
			variant: 'script',
			readonly: false
		},
		[inputFileId]: {
			id: inputFileId,
			name: `Inputs`,
			content: {
				value: inputsWithComments
			},
			isOpen: false,
			variant: 'note',
			readonly: false
		},
		[metadataFileId]: {
			id: metadataFileId,
			name: `Info`,
			content: { dynamic: { note: { noteId, variant: 'metadata' } } },
			isOpen: false,
			variant: 'note',
			readonly: true
		},
		[vaultFileId]: {
			id: vaultFileId,
			name: `Vault`,
			content: { dynamic: { note: { noteId, variant: 'vault' } } },
			isOpen: false,
			variant: 'note',
			readonly: true
		},
		[paybackScriptFileId]: {
			id: paybackScriptFileId,
			name: `Payback Script`,
			content: { value: paybackNoteData.script() },
			isOpen: false,
			variant: 'script',
			readonly: false
		},
		[paybackInputFileId]: {
			id: paybackInputFileId,
			name: `Payback Inputs`,
			content: {
				value: paybackInputsWithComments
			},
			isOpen: false,
			variant: 'note',
			readonly: false
		},
		[paybackMetadataFileId]: {
			id: paybackMetadataFileId,
			name: `Info`,
			content: { dynamic: { note: { noteId: paybackNoteId, variant: 'metadata' } } },
			isOpen: false,
			variant: 'note',
			readonly: true
		},
		[paybackVaultFileId]: {
			id: paybackVaultFileId,
			name: `Payback Vault`,
			content: { dynamic: { note: { noteId: paybackNoteId, variant: 'vault' } } },
			isOpen: false,
			variant: 'note',
			readonly: true
		}
	};

	const paybackRequestedAssets = [requestedAsset];
	if (requestedAsset.faucetId !== DEFAULT_FAUCET_IDS[0]) {
		paybackRequestedAssets.push({ faucetId: DEFAULT_FAUCET_IDS[0], amount: 0n });
	}

	if (requestedAsset.faucetId !== DEFAULT_FAUCET_IDS[1]) {
		paybackRequestedAssets.push({ faucetId: DEFAULT_FAUCET_IDS[1], amount: 0n });
	}

	const paybackNote = new Note({
		id: paybackNoteId,
		name: `Payback ${name}`,
		scriptFileId: paybackScriptFileId,
		metadataFileId: paybackMetadataFileId,
		isConsumed: false,
		assets: paybackRequestedAssets,
		inputFileId: paybackInputFileId,
		senderId: paybackNoteData.sender_id(),
		vaultFileId: paybackVaultFileId,
		initialNoteId: paybackNoteData.id(),
		isExpectedOutput: true,
		tag: paybackNoteData.tag(),
		aux: paybackNoteData.aux(),
		recipientDigest: ''
	});

	const paybackRecipientDigest = paybackNoteData.recipient_digest();
	paybackNote.recipientDigest = paybackRecipientDigest;

	const swapAssets = [offeredAsset];

	const note = new Note({
		id: noteId,
		name,
		scriptFileId,
		metadataFileId,
		isConsumed: false,
		assets: swapAssets,
		inputFileId,
		senderId: senderId.id,
		vaultFileId,
		tag,
		aux: BigInt(0),
		recipientDigest: ''
	});

	const noteData = createNoteData(
		note,
		new BigUint64Array(swapNoteInputs),
		SWAP_SCRIPT,
		senderScript
	);
	const recipientDigest = noteData.recipient_digest();
	note.recipientDigest = recipientDigest;

	const serialNumberString = note.serialNumberDecimalString.slice(0, 10);
	note.name = `${name} - ${serialNumberString}`;
	paybackNote.name = `${paybackNote.name} - ${paybackNote.serialNumberDecimalString.slice(0, 10)}`;
	return { note, newFiles, paybackNote };
}

export const SWAP_SCRIPT = `use.miden::note
use.miden::contracts::wallets::basic->wallet

# CONSTANTS
# =================================================================================================

const.PRIVATE_NOTE=2

# ERRORS
# =================================================================================================

# SWAP script expects exactly 10 note inputs
const.ERR_SWAP_WRONG_NUMBER_OF_INPUTS=0x00020055

# SWAP script requires exactly 1 note asset
const.ERR_SWAP_WRONG_NUMBER_OF_ASSETS=0x00020056

#! Swap script: adds an asset from the note into consumers account and
#! creates a note consumable by note issuer containing requested ASSET.
#!
#! Requires that the account exposes:
#! - miden::contracts::wallets::basic::receive_asset procedure.
#! - miden::contracts::wallets::basic::create_note procedure.
#! - miden::contracts::wallets::basic::move_asset_to_note procedure.
#!
#! Inputs:  []
#! Outputs: []
#!
#! Note inputs are assumed to be as follows:
#! - RECIPIENT
#! - ASSET
#! - TAG = [tag, 0, 0, 0]
#!
#! Panics if:
#! - account does not expose miden::contracts::wallets::basic::receive_asset procedure.
#! - account does not expose miden::contracts::wallets::basic::create_note procedure.
#! - account does not expose miden::contracts::wallets::basic::move_asset_to_note procedure.
#! - account vault does not contain the requested asset.
#! - adding a fungible asset would result in amount overflow, i.e., the total amount would be
#!   greater than 2^63.
begin
    # store the note inputs to memory starting at address 12
    push.12 exec.note::get_assets
    # => [num_assets, ptr]

    # make sure the number of inputs is 1
    assert.err=ERR_SWAP_WRONG_NUMBER_OF_ASSETS
    # => [ptr]

    # load the ASSET
    mem_loadw
    # => [ASSET]
    
    # pad the stack before call
    padw swapw padw padw swapdw
    # => [ASSET, pad(12)]

    # add the ASSET to the account
    call.wallet::receive_asset
    # => [pad(16)]

    # clean the stack
    repeat.4
        dropw
    end
    # => []

    # store note inputs into memory starting at address 0
    push.0 exec.note::get_inputs
    # => [num_inputs, inputs_ptr]

    # make sure the number of inputs is 10
    eq.10 assert.err=ERR_SWAP_WRONG_NUMBER_OF_INPUTS
    # => [inputs_ptr]

    # load RECIPIENT
    drop padw mem_loadw
    # => [RECIPIENT]

    padw mem_loadw.4
    # => [ASSET, RECIPIENT]

    padw mem_loadw.8
    # => [0, 0, execution_hint, tag, ASSET, RECIPIENT]

    drop drop swap
    # => [tag, execution_hint, ASSET, RECIPIENT]
    
    # we add aux = 0 to the note assuming we don't need it for the second leg of the SWAP
    push.0 swap
    # => [tag, aux, execution_hint, ASSET, RECIPIENT]

    push.PRIVATE_NOTE movdn.2
    # => [tag, aux, note_type, execution_hint, ASSET, RECIPIENT]

    swapw
    # => [ASSET, tag, aux, note_type, execution_hint, RECIPIENT]

    # create a note using inputs
    padw swapdw padw movdnw.2
    # => [tag, aux, note_type, execution_hint, RECIPIENT, pad(8), ASSET]
    call.wallet::create_note
    # => [note_idx, pad(15), ASSET]

    swapw dropw movupw.3 
    # => [ASSET, note_idx, pad(11)]

    # move asset to the note
    call.wallet::move_asset_to_note
    # => [ASSET, note_idx, pad(11)]

    # clean stack
    dropw dropw dropw dropw
    # => []
end`;
