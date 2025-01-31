import { Asset } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { Note } from '@/lib/notes';
import { EditorFiles } from '../files';

export function createP2IDRNote({
	senderId,
	receiverId,
	reclaimBlockHeight,
	assets,
	name
}: {
	senderId: bigint;
	receiverId: bigint;
	reclaimBlockHeight: number;
	assets: Asset[];
	name: string;
}): {
	note: Note;
	newFiles: EditorFiles;
} {
	const noteId = generateId();
	const scriptFileId = generateId();
	const inputFileId = generateId();
	const metadataFileId = generateId();
	const vaultFileId = generateId();
	const newFiles: EditorFiles = {
		[scriptFileId]: {
			id: scriptFileId,
			name: `${name} Script`,
			content: { value: P2IDR_SCRIPT },
			isOpen: false,
			variant: 'script',
			readonly: false
		},
		[inputFileId]: {
			id: inputFileId,
			name: `${name} Inputs`,
			content: {
				value: JSON.stringify([receiverId.toString(), reclaimBlockHeight], null, 2)
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
			variant: 'file',
			readonly: true
		},
		[vaultFileId]: {
			id: vaultFileId,
			name: `${name} Vault`,
			content: { dynamic: { note: { noteId, variant: 'vault' } } },
			isOpen: false,
			variant: 'file',
			readonly: true
		}
	};

	const note = new Note({
		id: noteId,
		name,
		scriptFileId,
		isConsumed: false,
		assets,
		inputFileId,
		senderId,
		metadataFileId,
		vaultFileId
	});
	return { note, newFiles };
}

const P2IDR_SCRIPT = `
use.miden::account
use.miden::note
use.miden::tx
use.miden::contracts::wallets::basic->wallet

# ERRORS
# =================================================================================================

# P2IDR scripts expect exactly 2 note inputs
const.ERR_P2IDR_WRONG_NUMBER_OF_INPUTS=0x00020052

# P2IDR's reclaimer is not the original sender
const.ERR_P2IDR_RECLAIM_ACCT_IS_NOT_SENDER=0x00020053

# P2IDR can not be reclaimed as the transaction's reference block is lower than the reclaim height
const.ERR_P2IDR_RECLAIM_HEIGHT_NOT_REACHED=0x00020054

#! Helper procedure to add all assets of a note to an account.
#!
#! Inputs: []
#! Outputs: []
#!
proc.add_note_assets_to_account
    push.0 exec.note::get_assets
    # => [num_of_assets, 0 = ptr, ...]

    # compute the pointer at which we should stop iterating
    dup.1 add
    # => [end_ptr, ptr, ...]

    # pad the stack and move the pointer to the top
    padw movup.5
    # => [ptr, 0, 0, 0, 0, end_ptr, ...]

    # compute the loop latch
    dup dup.6 neq
    # => [latch, ptr, 0, 0, 0, 0, end_ptr, ...]

    while.true
        # => [ptr, 0, 0, 0, 0, end_ptr, ...]

        # save the pointer so that we can use it later
        dup movdn.5
        # => [ptr, 0, 0, 0, 0, ptr, end_ptr, ...]

        # load the asset and add it to the account
        mem_loadw call.wallet::receive_asset
        # => [ASSET, ptr, end_ptr, ...]

        # increment the pointer and compare it to the end_ptr
        movup.4 add.1 dup dup.6 neq
        # => [latch, ptr+1, ASSET, end_ptr, ...]
    end

    # clear the stack
    drop dropw drop
end

# Pay to ID reclaimable: adds all assets from the note to the account, assuming ID of the account
# matches target account ID specified by the note inputs OR matches the sender ID if the note is
# consumed after the reclaim block height specified by the note inputs.
#
# Inputs: [SCRIPT_ROOT]
# Outputs: []
#
# Note inputs are assumed to be as follows:
# - target_account_id is the ID of the account for which the note is intended.
# - reclaim_block_height is the block height at which the note can be reclaimed by the sender.
#
# FAILS if:
# - Account does not expose miden::contracts::wallets::basic::receive_asset procedure.
# - Before reclaim block height: account ID of executing account is not equal to specified
#   account ID.
# - At and after reclaim block height: account ID of executing account is not equal to
#   specified account ID or Sender account ID.
# - The same non-fungible asset already exists in the account.
# - Adding a fungible asset would result in amount overflow, i.e., the total amount would be
#   greater than 2^63.
begin
    # drop the note script root
    dropw
    # => []

    # store the note inputs to memory starting at address 0
    push.0 exec.note::get_inputs
    # => [num_inputs, inputs_ptr]

    # make sure the number of inputs is 2
    eq.2 assert.err=ERR_P2IDR_WRONG_NUMBER_OF_INPUTS
    # => [inputs_ptr]

    # read the reclaim block height and target account id from the note inputs
    padw movup.4 mem_loadw drop drop
    # => [reclaim_block_height, target_account_id]

    exec.account::get_id dup
    # => [account_id, account_id, reclaim_block_height, target_account_id, ...]

    # determine if the current account is the target account
    movup.3 eq
    # => [is_target, account_id, reclaim_block_height, ...]

    if.true
        # if current account is the target, we don't need to check anything else
        # and so we just clear the stack
        drop drop

    else
        # if current account is not the target, we need to ensure it is the sender
        exec.note::get_sender
        # => [sender_account_id, account_id, reclaim_block_height, ...]

        assert_eq.err=ERR_P2IDR_RECLAIM_ACCT_IS_NOT_SENDER
        # => [reclaim_block_height, ...]

        # now check that sender is allowed to reclaim, current block >= reclaim block height
        exec.tx::get_block_number
        # => [current_block_height, reclaim_block_height, ...]

        u32assert2 u32lte assert.err=ERR_P2IDR_RECLAIM_HEIGHT_NOT_REACHED
    end

    exec.add_note_assets_to_account
    # => [...]

end
`;
