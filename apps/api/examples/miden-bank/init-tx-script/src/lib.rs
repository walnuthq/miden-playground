// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]
#![feature(alloc_error_handler)]

use miden::*;

/// Native (active) account this tx-script runs against: the bank-account `Bank` component.
#[account(bank_account::Bank)]
pub struct Wallet;

/// Initialize Transaction Script
///
/// This transaction script initializes the bank account, enabling deposits.
/// It must be executed by the bank account owner before any deposits can be made.
///
/// # Flow
/// 1. Transaction is created with this script attached
/// 2. Script executes in the context of the bank account
/// 3. Calls `account.initialize()` to enable deposits
/// 4. Bank is ready to process deposits after the transaction commits
///
/// # Arguments
/// * `_arg` - Transaction script argument (unused in this script)
/// * `account` - Mutable reference to the bank account (`Bank` component)
#[tx_script]
fn run(_arg: Word, account: &mut Wallet) {
    account.initialize();
}
