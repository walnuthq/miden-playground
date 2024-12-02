// TRANSACTION CONTEXT BUILDER
// ================================================================================================
use alloc::{collections::BTreeMap, vec::Vec};

use miden_lib::transaction::TransactionKernel;
use miden_objects::{
    accounts::Account,
    assembly::Assembler,
    notes::{Note, NoteId},
    transaction::{TransactionArgs, TransactionScript},
};
use vm_processor::{AdviceInputs, AdviceMap, Word};

use crate::mock_chain::{MockAuthenticator, MockChainBuilder};
use crate::transaction_context::TransactionContext;

// Structs
pub struct TransactionContextBuilder {
    assembler: Assembler,
    account: Account,
    account_seed: Option<Word>,
    advice_map: Option<AdviceMap>,
    advice_inputs: AdviceInputs,
    authenticator: Option<MockAuthenticator>,
    input_notes: Vec<Note>,
    expected_output_notes: Vec<Note>,
    tx_script: Option<TransactionScript>,
    note_args: BTreeMap<NoteId, Word>,
}

impl TransactionContextBuilder {
    pub fn new(account: Account) -> Self {
        Self {
            assembler: TransactionKernel::assembler(),
            account,
            account_seed: None,
            input_notes: Vec::new(),
            expected_output_notes: Vec::new(),
            advice_map: None,
            tx_script: None,
            authenticator: None,
            advice_inputs: Default::default(),
            note_args: BTreeMap::new(),
        }
    }

    pub fn input_notes(mut self, input_notes: Vec<Note>) -> Self {
        self.input_notes.extend(input_notes);
        self
    }

    pub fn build(self) -> TransactionContext {
        let mut mock_chain = MockChainBuilder::default()
            .notes(self.input_notes.clone())
            .build();

        for _ in 0..4 {
            mock_chain.seal_block(None);
        }

        let mut tx_args = TransactionArgs::new(
            self.tx_script,
            Some(self.note_args),
            self.advice_map.unwrap_or_default(),
        );

        let input_note_ids: Vec<NoteId> = mock_chain
            .available_notes()
            .iter()
            .map(|n| n.id())
            .collect();

        let tx_inputs = mock_chain.get_transaction_inputs(
            self.account.clone(),
            self.account_seed,
            &input_note_ids,
        );

        tx_args.extend_expected_output_notes(self.expected_output_notes.clone());

        TransactionContext {
            mock_chain,
            expected_output_notes: self.expected_output_notes,
            tx_args,
            tx_inputs,
            authenticator: self.authenticator,
            advice_inputs: self.advice_inputs,
            assembler: self.assembler,
        }
    }
}
