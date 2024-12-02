#![allow(dead_code)]
// MOCK HOST
// ================================================================================================

use alloc::{collections::BTreeMap, format, rc::Rc, string::String, string::ToString, sync::Arc};

use miden_lib::transaction::{TransactionEvent, TransactionKernelError};
use miden_objects::{
    accounts::{AccountCode, AccountHeader, AccountProcedureInfo, AccountVaultDelta},
    assembly::mast::MastForest,
    Digest, Felt,
};
use miden_tx::TransactionMastStore;
use vm_processor::{
    AdviceExtractor, AdviceInjector, AdviceInputs, AdviceProvider, AdviceSource, ContextId,
    ExecutionError, Host, HostResponse, MastForestStore, MemAdviceProvider, ProcessState,
};

// MOCK HOST
// ================================================================================================

/// This is very similar to the TransactionHost in miden-tx. The differences include:
/// - We do not track account delta here.
/// - There is special handling of EMPTY_DIGEST in account procedure index map.
/// - This host uses `MemAdviceProvider` which is instantiated from the passed in advice inputs.
pub struct MockHost {
    adv_provider: MemAdviceProvider,
    acct_procedure_index_map: AccountProcedureIndexMap,
    mast_store: Rc<TransactionMastStore>,
}

impl MockHost {
    /// Returns a new [MockHost] instance with the provided [AdviceInputs].
    pub fn new(
        account: AccountHeader,
        advice_inputs: AdviceInputs,
        mast_store: Rc<TransactionMastStore>,
    ) -> Self {
        let adv_provider: MemAdviceProvider = advice_inputs.into();
        let proc_index_map =
            AccountProcedureIndexMap::new(account.code_commitment(), &adv_provider);
        Self {
            adv_provider,
            acct_procedure_index_map: proc_index_map.unwrap(),
            mast_store,
        }
    }

    /// Consumes `self` and returns the advice provider and account vault delta.
    pub fn into_parts(self) -> (MemAdviceProvider, AccountVaultDelta) {
        (self.adv_provider, AccountVaultDelta::default())
    }

    // EVENT HANDLERS
    // --------------------------------------------------------------------------------------------

    fn on_push_account_procedure_index<S: ProcessState>(
        &mut self,
        process: &S,
    ) -> Result<(), ExecutionError> {
        let proc_idx = self
            .acct_procedure_index_map
            .get_proc_index(process)
            .map_err(|err| ExecutionError::EventError(err.to_string()))?;
        self.adv_provider
            .push_stack(AdviceSource::Value(proc_idx.into()))?;
        Ok(())
    }
}

impl Host for MockHost {
    fn get_advice<S: ProcessState>(
        &mut self,
        process: &S,
        extractor: AdviceExtractor,
    ) -> Result<HostResponse, ExecutionError> {
        self.adv_provider.get_advice(process, &extractor)
    }

    fn set_advice<S: ProcessState>(
        &mut self,
        process: &S,
        injector: AdviceInjector,
    ) -> Result<HostResponse, ExecutionError> {
        self.adv_provider.set_advice(process, &injector)
    }

    fn get_mast_forest(&self, node_digest: &Digest) -> Option<Arc<MastForest>> {
        self.mast_store.get(node_digest)
    }

    fn on_event<S: ProcessState>(
        &mut self,
        process: &S,
        event_id: u32,
    ) -> Result<HostResponse, ExecutionError> {
        let event = TransactionEvent::try_from(event_id)
            .map_err(|err| ExecutionError::EventError(err.to_string()))?;

        if process.ctx() != ContextId::root() {
            return Err(ExecutionError::EventError(format!(
                "{event} event can only be emitted from the root context"
            )));
        }

        match event {
            TransactionEvent::AccountPushProcedureIndex => {
                self.on_push_account_procedure_index(process)
            }
            _ => Ok(()),
        }?;

        Ok(HostResponse::None)
    }
}

// // TRANSACTION MAST STORE
// // ================================================================================================

// /// A store for the code available during transaction execution.
// ///
// /// Transaction MAST store contains a map between procedure MAST roots and [MastForest]s containing
// /// MASTs for these procedures. The VM will request [MastForest]s from the store when it encounters
// /// a procedure which it doesn't have the code for. Thus, to execute a program which makes
// /// references to external procedures, the store must be loaded with [MastForest]s containing these
// /// procedures.
// pub struct TransactionMastStore {
//     mast_forests: RefCell<BTreeMap<Digest, Arc<MastForest>>>,
// }

// #[allow(clippy::new_without_default)]
// impl TransactionMastStore {
//     /// Returns a new [TransactionMastStore] instantiated with the default libraries.
//     ///
//     /// The default libraries include:
//     /// - Miden standard library (miden-stdlib).
//     /// - Miden rollup library (miden-lib).
//     /// - Transaction kernel.
//     pub fn new() -> Self {
//         let mast_forests = RefCell::new(BTreeMap::new());
//         let store = Self { mast_forests };

//         // load transaction kernel MAST forest
//         let kernels_forest = Arc::new(TransactionKernel::kernel().into());
//         store.insert(kernels_forest);

//         // load miden-stdlib MAST forest
//         let miden_stdlib_forest = Arc::new(StdLibrary::default().into());
//         store.insert(miden_stdlib_forest);

//         // load miden lib MAST forest
//         let miden_lib_forest = Arc::new(MidenLib::default().into());
//         store.insert(miden_lib_forest);

//         store
//     }

//     /// Loads code required for executing a transaction with the specified inputs and args into
//     /// this store.
//     ///
//     /// The loaded code includes:
//     /// - Account code for the account specified in the provided [TransactionInputs].
//     /// - Note scripts for all input notes in the provided [TransactionInputs].
//     /// - Transaction script (if any) from the specified [TransactionArgs].
//     pub fn load_transaction_code(&self, tx_inputs: &TransactionInputs, tx_args: &TransactionArgs) {
//         // load account code
//         self.insert(tx_inputs.account().code().mast().clone());

//         // load note script MAST into the MAST store
//         for note in tx_inputs.input_notes() {
//             self.insert(note.note().script().mast().clone());
//         }

//         // load tx script MAST into the MAST store
//         if let Some(tx_script) = tx_args.tx_script() {
//             self.insert(tx_script.mast().clone());
//         }
//     }

//     /// Registers all procedures of the provided [MastForest] with this store.
//     pub fn insert(&self, mast_forest: Arc<MastForest>) {
//         let mut mast_forests = self.mast_forests.borrow_mut();

//         // only register procedures that are local to this forest
//         for proc_digest in mast_forest.local_procedure_digests() {
//             mast_forests.insert(proc_digest, mast_forest.clone());
//         }
//     }
// }

// // MAST FOREST STORE IMPLEMENTATION
// // ================================================================================================

// impl MastForestStore for TransactionMastStore {
//     fn get(&self, procedure_hash: &Digest) -> Option<Arc<MastForest>> {
//         self.mast_forests.borrow().get(procedure_hash).cloned()
//     }
// }

// ACCOUNT PROCEDURE INDEX MAP
// ================================================================================================

/// A map of proc_root |-> proc_index for all known procedures of an account interface.
pub struct AccountProcedureIndexMap(BTreeMap<Digest, u8>);

impl AccountProcedureIndexMap {
    /// Returns a new [AccountProcedureIndexMap] instantiated with account procedures present in
    /// the provided advice provider.
    pub fn new(
        account_code_commitment: Digest,
        adv_provider: &impl AdviceProvider,
    ) -> Result<Self, TransactionHostError> {
        // get the account procedures from the advice_map
        let proc_data = adv_provider
            .get_mapped_values(&account_code_commitment)
            .ok_or_else(|| {
                TransactionHostError::AccountProcedureIndexMapError(
                    "Failed to read account procedure data from the advice provider".to_string(),
                )
            })?;

        let mut result = BTreeMap::new();

        // sanity checks

        // check that there are procedures in the account code
        if proc_data.is_empty() {
            return Err(TransactionHostError::AccountProcedureIndexMapError(
                "The account code does not contain any procedures.".to_string(),
            ));
        }

        let num_procs = proc_data[0].as_int() as usize;

        // check that the account code does not contain too many procedures
        if num_procs > AccountCode::MAX_NUM_PROCEDURES {
            return Err(TransactionHostError::AccountProcedureIndexMapError(
                "The account code contains too many procedures.".to_string(),
            ));
        }

        // check that the stored number of procedures matches the length of the procedures array
        if num_procs * AccountProcedureInfo::NUM_ELEMENTS_PER_PROC != proc_data.len() - 1 {
            return Err(TransactionHostError::AccountProcedureIndexMapError(
                "Invalid number of procedures.".to_string(),
            ));
        }

        // we skip proc_data[0] because it's the number of procedures
        for (proc_idx, proc_info) in proc_data[1..]
            .chunks_exact(AccountProcedureInfo::NUM_ELEMENTS_PER_PROC)
            .enumerate()
        {
            let proc_info_array: [Felt; AccountProcedureInfo::NUM_ELEMENTS_PER_PROC] = proc_info
                .try_into()
                .expect("Failed conversion into procedure info array.");

            let procedure = AccountProcedureInfo::try_from(proc_info_array).map_err(|e| {
                TransactionHostError::AccountProcedureIndexMapError(format!(
                    "Failed to create AccountProcedureInfo: {:?}",
                    e
                ))
            })?;

            let proc_idx = u8::try_from(proc_idx).expect("Invalid procedure index.");

            result.insert(*procedure.mast_root(), proc_idx);
        }

        Ok(Self(result))
    }

    /// Returns index of the procedure whose root is currently at the top of the operand stack in
    /// the provided process.
    ///
    /// # Errors
    /// Returns an error if the procedure at the top of the operand stack is not present in this
    /// map.
    pub fn get_proc_index(
        &self,
        process: &impl ProcessState,
    ) -> Result<u8, TransactionKernelError> {
        let proc_root = process.get_stack_word(0).into();

        // mock account method for testing from root context
        // TODO: figure out if we can get rid of this
        if proc_root == Digest::default() {
            return Ok(255);
        }

        self.0
            .get(&proc_root)
            .cloned()
            .ok_or(TransactionKernelError::UnknownAccountProcedure(proc_root))
    }
}

#[derive(Debug)]
pub enum TransactionHostError {
    AccountProcedureIndexMapError(String),
}
