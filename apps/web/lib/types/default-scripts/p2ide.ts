import { type Script, defaultScript } from "@/lib/types/script";
import { P2IDE_NOTE_CODE } from "@/lib/constants";

export const p2ideRust = ``;

export const p2ideMasm = `use.miden::account
use.miden::account_id
use.miden::active_note
use.miden::tx

# ERRORS
# =================================================================================================

const.ERR_P2IDE_WRONG_NUMBER_OF_INPUTS="P2IDE note expects exactly 4 note inputs"

const.ERR_P2IDE_RECLAIM_ACCT_IS_NOT_SENDER="failed to reclaim P2IDE note because the reclaiming account is not the sender"

const.ERR_P2IDE_RECLAIM_HEIGHT_NOT_REACHED="failed to reclaim P2IDE note because the reclaim block height is not reached yet"

const.ERR_P2IDE_RECLAIM_DISABLED="P2IDE reclaim is disabled"

const.ERR_P2IDE_TIMELOCK_HEIGHT_NOT_REACHED="failed to consume P2IDE note because the note is still timelocked"

# HELPER PROCEDURES
# =================================================================================================

#! Helper procedure to check if the P2IDE note is unlocked.
#!
#! Inputs:  [current_block_height, timelock_block_height]
#! Outputs: [current_block_height]
proc.verify_unlocked
    dup movdn.2
    # => [current_block_height, timelock_block_height, current_block_height]

    # check timelock_block_height <= current_block_height
    lte assert.err=ERR_P2IDE_TIMELOCK_HEIGHT_NOT_REACHED
    # => [current_block_height]
end

#! Helper procedure which adds the note assets to the sender account.
#!
#! Checks if P2IDE reclaim is enabled and if true, if reclaim height has been reached.
#!
#! Inputs:  [account_id_prefix, account_id_suffix, current_block_height, reclaim_block_height]
#! Outputs: []
#!
#! Panics if:
#! - the reclaim of the active note is disabled.
#! - the reclaim block height is not reached yet.
#! - the account attempting to reclaim the note is not the sender account.
proc.reclaim_note
    # check that the reclaim of the active note is enabled
    movup.3 dup neq.0 assert.err=ERR_P2IDE_RECLAIM_DISABLED
    # => [reclaim_block_height, account_id_prefix, account_id_suffix, current_block_height]

    # now check that sender is allowed to reclaim, reclaim block height <= current block height
    movup.3
    # => [current_block_height, reclaim_block_height, account_id_prefix, account_id_suffix]

    lte assert.err=ERR_P2IDE_RECLAIM_HEIGHT_NOT_REACHED
    # => [account_id_prefix, account_id_suffix]

    # if current account is not the target, we need to ensure it is the sender
    exec.active_note::get_sender
    # => [sender_account_id_prefix, sender_account_id_suffix, account_id_prefix, account_id_suffix]

    # ensure current account ID = sender account ID
    exec.account_id::is_equal assert.err=ERR_P2IDE_RECLAIM_ACCT_IS_NOT_SENDER
    # => []

    # add note assets to account
    exec.active_note::add_assets_to_account
    # => []
end

#! Extended Pay-to-ID note script (Reclaimable & Timelockable)
#!
#! Adds all assets from the note to the account if all of the following conditions are true:
#! - The transaction's reference block number is greater than or equal to the note's timelock block height.
#! - Any of the following conditions is true:
#!   - The account ID against which the transaction is executed matches the note's target account id.
#!   - The account ID against which the transaction is executed matches the note's sender account id and
#!     the transaction's reference block number is greater than or equal to the note's reclaim block height.
#!
#! Requires that the account exposes:
#! - miden::contracts::wallets::basic::receive_asset procedure.
#!
#! Inputs:  []
#! Outputs: []
#!
#! Note inputs are assumed to be as follows:
#! - target_account_id is the ID of the account for which the note is intended.
#! - reclaim_block_height is the block height at which the note can be reclaimed by the sender.
#! - timelock_block_height is the block height at which the note can be consumed by the target.
#!
#! Panics if:
#! - The account does not expose miden::contracts::wallets::basic::receive_asset procedure.
#! - The note is consumed before the timelock expired, i.e. the transaction's reference block
#!   number is less than the timelock block height.
#! - Before reclaim block height: the account ID of the executing account is not equal to the specified
#!   account ID.
#! - At and after reclaim block height: the account ID of the executing account is not equal to
#!   the specified account ID or sender account ID.
#! - The same non-fungible asset already exists in the account.
#! - Adding a fungible asset would result in an amount overflow, i.e., the total amount would be
#!   greater than 2^63.
begin
    # store the note inputs to memory starting at address 0
    push.0 exec.active_note::get_inputs
    # => [num_inputs, inputs_ptr]

    # make sure the number of inputs is 4
    eq.4 assert.err=ERR_P2IDE_WRONG_NUMBER_OF_INPUTS
    # => [inputs_ptr]

    # read the reclaim block height, timelock_block_height, and target account ID from the note inputs
    mem_loadw
    # => [timelock_block_height, reclaim_block_height, target_account_id_prefix, target_account_id_suffix]

    # read the current block number
    exec.tx::get_block_number
    # => [current_block_height, timelock_block_height, reclaim_block_height, target_account_id_prefix, target_account_id_suffix]

    # fails if note is locked
    exec.verify_unlocked
    # => [current_block_height, reclaim_block_height, target_account_id_prefix, target_account_id_suffix]

    # get current account id
    exec.account::get_id dup.1 dup.1
    # => [account_id_prefix, account_id_suffix, account_id_prefix, account_id_suffix, current_block_height, reclaim_block_height, target_account_id_prefix, target_account_id_suffix]

    # determine if the current account is the target account
    movup.7 movup.7 exec.account_id::is_equal
    # => [is_target, account_id_prefix, account_id_suffix, current_block_height, reclaim_block_height]

    if.true
        # we can safely consume the note since the current account is the target of the note
        dropw exec.active_note::add_assets_to_account
        # => []

    else
        # checks if current account is sender and if reclaim is enabled
        exec.reclaim_note
        # => []
    end

    # => []
end
`;

const p2ide: Script = {
  ...defaultScript(),
  id: "p2ide",
  name: "P2IDE",
  packageName: "p2ide",
  type: "note",
  status: "compiled",
  readOnly: true,
  rust: p2ideRust,
  masm: p2ideMasm,
  root: P2IDE_NOTE_CODE,
};

export default p2ide;
