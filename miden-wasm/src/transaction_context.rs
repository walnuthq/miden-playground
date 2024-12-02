#![allow(dead_code)]
use alloc::{rc::Rc, sync::Arc, vec::Vec};

use miden_lib::transaction::TransactionKernel;
use miden_objects::{
    accounts::{Account, AccountId},
    assembly::Assembler,
    notes::{Note, NoteId},
    transaction::{ExecutedTransaction, InputNote, InputNotes, TransactionArgs, TransactionInputs},
};
use miden_tx::{
    auth::TransactionAuthenticator, DataStore, DataStoreError, TransactionExecutor,
    TransactionExecutorError, TransactionMastStore,
};
use vm_processor::{AdviceInputs, ExecutionError, Host, Process, Program, StackInputs};
use winter_maybe_async::{maybe_async, maybe_await};

use crate::mock_chain::{MockAuthenticator, MockChain};
use crate::mock_host::MockHost;

// TRANSACTION CONTEXT
// ================================================================================================

#[derive(Clone)]
/// Represents all needed data for executing a transaction, or arbitrary code.
///
/// It implements [DataStore], so transactions may be executed with
/// [TransactionExecutor](crate::TransactionExecutor)
pub struct TransactionContext {
    pub mock_chain: MockChain,
    pub expected_output_notes: Vec<Note>,
    pub tx_args: TransactionArgs,
    pub tx_inputs: TransactionInputs,
    pub advice_inputs: AdviceInputs,
    pub authenticator: Option<MockAuthenticator>,
    pub assembler: Assembler,
}

impl TransactionContext {
    /// Executes arbitrary code within the context of a mocked transaction environment and returns
    /// the resulting [Process].
    ///
    /// The code is compiled with the assembler attached to this context and executed with advice
    /// inputs constructed from the data stored in the context. The program is run on a [MockHost]
    /// which is loaded with the procedures exposed by the transaction kernel, and also individual
    /// kernel functions (not normally exposed).
    ///
    /// # Errors
    /// Returns an error if the assembly of execution of the provided code fails.
    pub fn execute_code(&self, code: &str) -> Result<Process<MockHost>, ExecutionError> {
        let (stack_inputs, mut advice_inputs) = TransactionKernel::prepare_inputs(
            &self.tx_inputs,
            &self.tx_args,
            Some(self.advice_inputs.clone()),
        );
        advice_inputs.extend(self.advice_inputs.clone());

        let mast_store = Rc::new(TransactionMastStore::new());

        let test_lib = TransactionKernel::kernel();
        mast_store.insert(test_lib.mast_forest().clone());

        let program = self.assembler.clone().assemble_program(code).unwrap();
        mast_store.insert(program.mast_forest().clone());
        mast_store.load_transaction_code(&self.tx_inputs, &self.tx_args);

        CodeExecutor::new(MockHost::new(
            self.tx_inputs.account().into(),
            advice_inputs,
            mast_store,
        ))
        .stack_inputs(stack_inputs)
        .execute_program(program)
    }

    /// Executes the transaction through a [TransactionExecutor]
    #[maybe_async]
    pub fn execute(self) -> Result<ExecutedTransaction, TransactionExecutorError> {
        let mock_data_store = self.clone();

        let account_id = self.account().id();
        let block_num = mock_data_store.tx_inputs.block_header().block_num();
        let authenticator = self
            .authenticator
            .map(|auth| Arc::new(auth) as Arc<dyn TransactionAuthenticator>);
        let tx_executor = TransactionExecutor::new(Arc::new(mock_data_store), authenticator);
        let notes: Vec<NoteId> = self
            .tx_inputs
            .input_notes()
            .into_iter()
            .map(|n| n.id())
            .collect();

        maybe_await!(tx_executor.execute_transaction(account_id, block_num, &notes, self.tx_args))
    }

    pub fn account(&self) -> &Account {
        self.tx_inputs.account()
    }

    pub fn expected_output_notes(&self) -> &[Note] {
        &self.expected_output_notes
    }

    pub fn mock_chain(&self) -> &MockChain {
        &self.mock_chain
    }

    pub fn input_notes(&self) -> InputNotes<InputNote> {
        InputNotes::new(self.mock_chain.available_notes().clone()).unwrap()
    }

    pub fn tx_args(&self) -> &TransactionArgs {
        &self.tx_args
    }

    pub fn set_tx_args(&mut self, tx_args: TransactionArgs) {
        self.tx_args = tx_args;
    }

    pub fn tx_inputs(&self) -> &TransactionInputs {
        &self.tx_inputs
    }
}

impl DataStore for TransactionContext {
    #[maybe_async]
    fn get_transaction_inputs(
        &self,
        account_id: AccountId,
        block_num: u32,
        notes: &[NoteId],
    ) -> Result<TransactionInputs, DataStoreError> {
        assert_eq!(account_id, self.tx_inputs.account().id());
        assert_eq!(block_num, self.tx_inputs.block_header().block_num());
        assert_eq!(notes.len(), self.tx_inputs.input_notes().num_notes());

        Ok(self.tx_inputs.clone())
    }
}

// MOCK CODE EXECUTOR
// ================================================================================================

/// Helper for executing arbitrary code within arbitrary hosts.
pub struct CodeExecutor<H> {
    host: H,
    stack_inputs: Option<StackInputs>,
    advice_inputs: AdviceInputs,
}

impl<H: Host> CodeExecutor<H> {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    pub fn new(host: H) -> Self {
        Self {
            host,
            stack_inputs: None,
            advice_inputs: AdviceInputs::default(),
        }
    }

    pub fn extend_advice_inputs(mut self, advice_inputs: AdviceInputs) -> Self {
        self.advice_inputs.extend(advice_inputs);
        self
    }

    pub fn stack_inputs(mut self, stack_inputs: StackInputs) -> Self {
        self.stack_inputs = Some(stack_inputs);
        self
    }

    /// Compiles and runs the desired code in the host and returns the [Process] state
    pub fn run(self, code: &str) -> Result<Process<H>, ExecutionError> {
        let program = TransactionKernel::assembler()
            .assemble_program(code)
            .unwrap();
        self.execute_program(program)
    }

    pub fn execute_program(self, program: Program) -> Result<Process<H>, ExecutionError> {
        let mut process = Process::new_debug(
            program.kernel().clone(),
            self.stack_inputs.unwrap_or_default(),
            self.host,
        );
        process.execute(&program)?;

        Ok(process)
    }
}
