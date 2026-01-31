import { type Script, defaultScript } from "@/lib/types/script";
import { BASIC_WALLET_CODE } from "@/lib/constants";

export const timelockP2idRust = `// Do not link against libstd (i.e. anything defined in \`std::\`)
#![no_std]
#![feature(alloc_error_handler)]

use miden::*;

use crate::bindings::Account;

#[note]
struct P2idNote;

#[note]
impl P2idNote {
    #[note_script]
    pub fn run(self, _arg: Word, account: &mut Account) {
        let inputs = active_note::get_inputs();

        let target_account_id_prefix = inputs[0];
        let target_account_id_suffix = inputs[1];

        // get consuming account id
        let consuming_account_id = account.get_id();

        // target account id
        let target_account_id = AccountId::new(target_account_id_prefix, target_account_id_suffix);

        assert_eq!(current_account, target_account_id);

        let assets = active_note::get_assets();
        for asset in assets {
            account.receive_asset(asset);
        }
    }
}
`;

export const timelockP2idMasm = `use miden::protocol::active_account
use miden::protocol::account_id
use miden::protocol::active_note
use miden::standards::wallets::basic->basic_wallet

# ERRORS
# =================================================================================================

const ERR_P2ID_UNEXPECTED_NUMBER_OF_STORAGE_ITEMS="P2ID note expects exactly 2 note storage items"

const ERR_P2ID_TARGET_ACCT_MISMATCH="P2ID's target account address and transaction address do not match"

#! Pay-to-ID script: adds all assets from the note to the account, assuming ID of the account
#! matches target account ID specified by the note storage.
#!
#! Requires that the account exposes:
#! - miden::standards::wallets::basic::receive_asset procedure.
#!
#! Inputs:  []
#! Outputs: []
#!
#! Note storage is assumed to be as follows:
#! - target_account_id is the ID of the account for which the note is intended.
#!
#! Panics if:
#! - Account does not expose miden::standards::wallets::basic::receive_asset procedure.
#! - Account ID of executing account is not equal to the Account ID specified via note storage.
#! - The same non-fungible asset already exists in the account.
#! - Adding a fungible asset would result in amount overflow, i.e., the total amount would be
#!   greater than 2^63.
pub proc main
    # store the note storage to memory starting at address 0
    padw push.0 exec.active_note::get_storage
    # => [num_storage_items, storage_ptr, EMPTY_WORD]

    # make sure the number of storage items is 2
    eq.2 assert.err=ERR_P2ID_UNEXPECTED_NUMBER_OF_STORAGE_ITEMS
    # => [storage_ptr, EMPTY_WORD]

    # read the target account ID from the note storage
    mem_loadw_be drop drop
    # => [target_account_id_prefix, target_account_id_suffix]

    exec.active_account::get_id
    # => [account_id_prefix, account_id_suffix, target_account_id_prefix, target_account_id_suffix, ...]

    # ensure account_id = target_account_id, fails otherwise
    exec.account_id::is_equal assert.err=ERR_P2ID_TARGET_ACCT_MISMATCH
    # => []

    exec.basic_wallet::add_assets_to_account
    # => []
end
`;

const timelockP2id: Script = {
  ...defaultScript(),
  id: "timelock-p2id",
  name: "timelock-p2id",
  type: "note-script",
  status: "compiled",
  readOnly: true,
  rust: timelockP2idRust,
  masm: timelockP2idMasm,
  dependencies: [
    { id: "basic-wallet", name: "basic-wallet", digest: BASIC_WALLET_CODE },
  ],
  digest: "0x94377a3ed496ef4282bb98b1df09f14be986f5ffed1ac5dd2f7e23e01d9c3bce",
};

export default timelockP2id;
