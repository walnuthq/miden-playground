// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]
#![feature(alloc_error_handler)]

use miden::*;

/// Native (active) account of this note: exposes the `bank-account` component's
/// `Bank` methods, gathered from the `bank-account` package's generated WIT.
#[account(bank_account::Bank)]
pub struct Wallet;

/// Withdraw Request Note Script
///
/// When consumed by the Bank account, this note requests a withdrawal and
/// the bank creates a P2ID note to send assets back to the depositor.
///
/// # Flow
/// 1. Note is created by a depositor specifying the withdrawal details
/// 2. Bank account consumes this note
/// 3. Note script reads the storage items (asset, serial_num, tag, note_type; script_root is read by the bank itself)
/// 4. Calls `account.withdraw(asset, serial_num, tag, note_type)`
/// 5. Bank identifies the depositor internally via `active_note::get_sender()` — cryptographically bound to this note's metadata, so it cannot be spoofed
/// 6. Bank updates the depositor's balance and creates a P2ID note to send assets back
///
/// # Note Storage (14 Felts)
/// [0-3]: withdraw asset, encoded as [amount, 0, faucet_suffix(+metadata), faucet_prefix].
///        Reconstructed into the v0.17 vault key [0, 0, storage[2], storage[3]] and value
///        [amount, 0, 0, 0]. `storage[2]` carries the faucet suffix with the asset's metadata
///        byte in its low 8 bits (host side: `FungibleAsset::to_id_word()[2]`), not the raw
///        suffix — so the bank reconstructs exactly the key the depositor's asset had.
/// [4-7]: serial_num (random/unique per note)
/// [8]: tag (P2ID note tag for routing)
/// [9]: note_type (1 = Public, 0 = Private)
/// [10-13]: P2ID script_root (MAST root of the P2ID note script, Poseidon2-hashed).
///          Consumed by the bank account directly from the active note's storage inside
///          `Bank::withdraw`, so it never appears on the call — this keeps that
///          function within the flat-params limit (≤ 16).
#[note]
struct WithdrawRequestNote;

#[note]
impl WithdrawRequestNote {
    #[note_script]
    fn run(self, _arg: Word, account: &mut Wallet) {
        // Get the storage items and validate the expected count.
        let storage = active_note::get_storage();
        assert!(
            storage.len() == 14,
            "Withdraw request requires exactly 14 storage items"
        );

        // Asset: reconstruct the v0.17 fungible-asset key/value from the note storage.
        // id    = [0, 0, storage[2], storage[3]] where storage[2] = faucet suffix + metadata
        //         byte (low 8 bits) and storage[3] = faucet prefix.
        // value = [amount, 0, 0, 0]
        let withdraw_asset = Asset::new(
            Word::from([felt!(0), felt!(0), storage[2], storage[3]]),
            Word::from([storage[0], felt!(0), felt!(0), felt!(0)]),
        );

        // Serial number: full 4 Felts (random/unique per note)
        let serial_num = Word::from([storage[4], storage[5], storage[6], storage[7]]);

        // Tag: single Felt for P2ID note routing
        let tag = storage[8];

        // Note type: 1 = Public, 0 = Private
        let note_type = storage[9];

        // Note: P2ID script root (storage[10..13]) is read by the bank account directly
        // from the active note's storage inside `Bank::withdraw`.

        // Call the bank account to withdraw the assets.
        // The bank identifies the depositor internally via `active_note::get_sender()`,
        // which is cryptographically bound to this note's metadata and cannot be spoofed.
        account.withdraw(withdraw_asset, serial_num, tag, note_type);
    }
}
