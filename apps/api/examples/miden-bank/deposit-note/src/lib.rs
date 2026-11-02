// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]
#![feature(alloc_error_handler)]

use miden::*;

/// Native (active) account of this note: exposes the `bank-account` component's
/// `Bank` methods, gathered from the `bank-account` package's generated WIT.
#[account(bank_account::Bank)]
pub struct Wallet;

/// Deposit Note Script
///
/// When consumed by the Bank account, this note transfers all its assets
/// to the bank and credits the depositor (note sender) with the deposited amount.
///
/// # Flow
/// 1. Note is created by a user with fungible assets attached
/// 2. Bank account consumes this note
/// 3. Note script reads the sender (depositor) and assets
/// 4. For each asset, calls `account.deposit(depositor, asset)`
/// 5. Bank receives the asset and updates the depositor's balance
///
/// # Note Inputs
/// None required - the depositor is automatically the note's sender.
#[note]
struct DepositNote;

#[note]
impl DepositNote {
    #[note_script]
    fn run(self, _arg: Word, account: &mut Wallet) {
        // The depositor is whoever created/sent this note
        let depositor = active_note::get_sender();

        // Get all assets attached to this note
        let assets = active_note::get_initial_assets();

        // Deposit each asset into the bank
        for asset in assets {
            account.deposit(depositor, asset);
        }
    }
}
