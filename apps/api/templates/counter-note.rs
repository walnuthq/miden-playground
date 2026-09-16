// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;
// use alloc::vec::Vec;

use miden::*;

/// Native account of the note: exposes the `counter-contract` component methods gathered from the
/// `counter-account` package. The struct cannot be named `CounterContract`, because the account
/// reference generates a trait of that name.
#[account(counter_account::CounterContract)]
pub struct CounterAccount;

#[note]
struct CounterNote;

#[note]
impl CounterNote {
    #[note_script]
    fn run(self, _arg: Word, account: &mut CounterAccount) {
        let initial_value = account.get_count();
        account.increment_count();
        let expected_value = initial_value + felt!(1);
        let final_value = account.get_count();
        assert_eq(final_value, expected_value);
    }
}
