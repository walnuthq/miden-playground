import { Asset } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { createSwapNotes } from '@/lib/miden-wasm-api';
import { Note } from '@/lib/notes';
import { EditorFiles } from '../files';

export function createSwapNote({
	senderId,
	receiverId,
	offeredAsset,
	requestedAsset,
	name
}: {
	senderId: bigint;
	receiverId: bigint;
	offeredAsset: Asset;
	requestedAsset: Asset;
	name: string;
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
	const { swapNoteInputs, paybackNote: paybackNoteData } = createSwapNotes(
		senderId,
		receiverId,
		requestedAsset,
		offeredAsset
	);
	const inputs: string[] = [];
	for (const input of swapNoteInputs) {
		inputs.push(input.toString());
	}

	console.log('swapNoteInputs', swapNoteInputs);

	const paybackNoteId = generateId();
	const paybackScriptFileId = generateId();
	const paybackInputFileId = generateId();
	const paybackMetadataFileId = generateId();
	const paybackVaultFileId = generateId();

	const paybackInputs: string[] = [];
	for (const input of paybackNoteData.inputs()) {
		paybackInputs.push(input.toString());
	}

	const newFiles: EditorFiles = {
		[scriptFileId]: {
			id: scriptFileId,
			name: `${name} Script`,
			content: { value: SWAP_SCRIPT },
			isOpen: false,
			variant: 'script',
			readonly: false
		},
		[inputFileId]: {
			id: inputFileId,
			name: `${name} Inputs`,
			content: {
				value: JSON.stringify(inputs, null, 2)
			},
			isOpen: false,
			variant: 'note',
			readonly: false
		},
		[metadataFileId]: {
			id: metadataFileId,
			name: `${name} Metadata`,
			content: { dynamic: { note: { noteId, variant: 'metadata' } } },
			isOpen: false,
			variant: 'note',
			readonly: true
		},
		[vaultFileId]: {
			id: vaultFileId,
			name: `${name} Vault`,
			content: { dynamic: { note: { noteId, variant: 'vault' } } },
			isOpen: false,
			variant: 'note',
			readonly: true
		},
		[paybackScriptFileId]: {
			id: paybackScriptFileId,
			name: `Payback ${name} Script`,
			content: { value: paybackNoteData.script() },
			isOpen: false,
			variant: 'script',
			readonly: false
		},
		[paybackInputFileId]: {
			id: paybackInputFileId,
			name: `Payback ${name} Inputs`,
			content: {
				value: JSON.stringify(paybackInputs, null, 2)
			},
			isOpen: false,
			variant: 'note',
			readonly: false
		},
		[paybackMetadataFileId]: {
			id: paybackMetadataFileId,
			name: `Payback ${name} Metadata`,
			content: { dynamic: { note: { noteId: paybackNoteId, variant: 'metadata' } } },
			isOpen: false,
			variant: 'note',
			readonly: true
		},
		[paybackVaultFileId]: {
			id: paybackVaultFileId,
			name: `Payback ${name} Vault`,
			content: { dynamic: { note: { noteId: paybackNoteId, variant: 'vault' } } },
			isOpen: false,
			variant: 'note',
			readonly: true
		}
	};

	const paybackNote = new Note({
		id: paybackNoteId,
		name: `Payback ${name}`,
		scriptFileId: paybackScriptFileId,
		metadataFileId: paybackMetadataFileId,
		isConsumed: false,
		assets: [requestedAsset],
		inputFileId: paybackInputFileId,
		senderId: paybackNoteData.sender_id(),
		vaultFileId: paybackVaultFileId
	});

	const note = new Note({
		id: noteId,
		name,
		scriptFileId,
		metadataFileId,
		isConsumed: false,
		assets: [offeredAsset],
		inputFileId,
		senderId,
		vaultFileId
	});

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

# Swap script: adds an asset from the note into consumers account and
# creates a note consumable by note issuer containing requested ASSET.
#
# Requires that the account exposes:
#
# Inputs: [SCRIPT_ROOT]
# Outputs: []
#
# Note inputs are assumed to be as follows:
# - RECIPIENT
# - ASSET
# - TAG = [tag, 0, 0, 0]
#
# FAILS if:
# - Account does not expose miden::contracts::wallets::basic::receive_asset procedure
# - Account does not expose miden::contracts::wallets::basic::create_note procedure
# - Account does not expose miden::contracts::wallets::basic::move_asset_to_note procedure
# - Account vault does not contain the requested asset
# - Adding a fungible asset would result in amount overflow, i.e., the total amount would be
#   greater than 2^63
begin
    # drop the transaction script root
    dropw
    # => []

    # store ASSET into memory at address 3
    push.3 exec.note::get_assets assert.err=ERR_SWAP_WRONG_NUMBER_OF_ASSETS
    # => [ptr]

    # load the ASSET and add it to the account
    mem_loadw call.wallet::receive_asset dropw
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

    padw mem_loadw.1
    # => [ASSET, RECIPIENT]

    padw mem_loadw.2
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
    # => [tag, aux, note_type, execution_hint, RECIPIENT, PAD(8), ASSET]
    call.wallet::create_note
    # => [note_idx, PAD(15), ASSET]

    swapw dropw movupw.3 
    # => [ASSET, note_idx, PAD(11)]

    # move asset to the note
    call.wallet::move_asset_to_note
    # => [ASSET, note_idx, PAD(11)]

    # clean stack
    dropw dropw dropw dropw
    # => []
end`;
