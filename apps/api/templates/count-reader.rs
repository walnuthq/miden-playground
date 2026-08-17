// Do not link against libstd (i.e. anything defined in `std::`)
#![no_std]
#![feature(alloc_error_handler)]

// However, we could still use some standard library types while
// remaining no-std compatible, if we uncommented the following lines:
//
// extern crate alloc;

use miden::{account, component, component_storage, AccountId, Felt, StorageValue};

#[account(counter_account::CounterContract)]
pub struct CounterContract;

#[component_storage]
struct CountReaderStorage {
    #[storage(description = "count reader storage value")]
    counter: StorageValue<Felt>,
}

#[component]
trait CountReader {
    fn copy_count(&mut self, counter_account_id: AccountId);
}

#[component]
impl CountReader for CountReaderStorage {
    fn copy_count(&mut self, counter_account_id: AccountId) {
        let counter_account = CounterContract::new(counter_account_id);
        self.counter.set(counter_account.get_count());
    }
}
