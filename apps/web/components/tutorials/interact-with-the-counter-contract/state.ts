import { type State, initialState } from "@/components/global-context/reducer";

const state: State = {
  ...initialState(),
  networkId: "mtst",
  scripts: [
    {
      id: "counter-contract",
      name: "Counter Contract",
      type: "account",
      status: "compiled",
      rust: "// Do not link against libstd (i.e. anything defined in `std::`)\n#![no_std]\n\n// However, we could still use some standard library types while\n// remaining no-std compatible, if we uncommented the following lines:\n//\nextern crate alloc;\n\n// Global allocator to use heap memory in no-std environment\n#[global_allocator]\nstatic ALLOC: miden::BumpAlloc = miden::BumpAlloc::new();\n\n// Define a panic handler as required by the `no_std` environment\n#[cfg(not(test))]\n#[panic_handler]\nfn panic(_info: &core::panic::PanicInfo) -> ! {\n    // For now, just loop indefinitely\n    loop {}\n}\n\nmod bindings;\n\nuse bindings::exports::miden::counter_contract::counter::Guest;\nuse miden::{component, felt, Felt, StorageMap, StorageMapAccess, Word};\n\n/// Main contract structure for the counter example.\n#[component]\nstruct CounterContract {\n    /// Storage map holding the counter value.\n    #[storage(slot(0), description = \"counter contract storage map\")]\n    count_map: StorageMap,\n}\n\nbindings::export!(CounterContract with_types_in bindings);\n\nimpl Guest for CounterContract {\n    /// Returns the current counter value stored in the contract's storage map.\n    fn get_count() -> Felt {\n        // Get the instance of the contract\n        let contract = CounterContract::default();\n        // Define a fixed key for the counter value within the map\n        let key = Word::from([felt!(0), felt!(0), felt!(0), felt!(1)]);\n        // Read the value associated with the key from the storage map\n        contract.count_map.get(&key)\n    }\n\n    /// Increments the counter value stored in the contract's storage map by one.\n    fn increment_count() -> Felt {\n        // Get the instance of the contract\n        let contract = CounterContract::default();\n        // Define the same fixed key\n        let key = Word::from([felt!(0), felt!(0), felt!(0), felt!(1)]);\n        // Read the current value\n        let current_value: Felt = contract.count_map.get(&key);\n        // Increment the value by one\n        let new_value = current_value + felt!(1);\n        // Write the new value back to the storage map\n        contract.count_map.set(key, new_value);\n        new_value\n    }\n}\n",
      masm: "use.miden::account\nuse.std::sys\n\n# => []\nexport.get_count\n    push.0\n    # => [index]\n\n    # exec.account::get_item\n    # => [count]\n\n    # exec.sys::truncate_stack\n    # => []\nend\n\n# => []\nexport.increment_count\n    push.0\n    # => [index]\n\n    exec.account::get_item\n    # => [count]\n\n    push.1 add\n    # => [count+1]\n\n    # debug statement with client\n    debug.stack\n\n    push.0\n    # [index, count+1]\n\n    exec.account::set_item\n    # => []\n\n    push.1 exec.account::incr_nonce\n    # => []\n\n    exec.sys::truncate_stack\n    # => []\nend\n",
      error: "",
      root: "",
      updatedAt: 0,
    },
  ],
  components: [
    {
      id: "counter-contract",
      name: "Counter Contract",
      type: "account",
      scriptId: "counter-contract",
      // storageSlots: [{ name: "Count Map", type: "map", value: "1:10" }],
      storageSlots: [{ name: "Counter", type: "value", value: "10" }],
      updatedAt: 0,
    },
  ],
  tutorialId: "interact-with-the-counter-contract",
};

export default state;
